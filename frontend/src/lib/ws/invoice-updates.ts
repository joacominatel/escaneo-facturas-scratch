import { io as socketIO, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api/client";

// Definir DisconnectReason de forma más robusta
type DisconnectReason = Socket["disconnect"] extends (reason: infer R, ...args: any[]) => any ? R : string;
// Definir un tipo para el listener de desconexión que acepte el argumento opcional
type DisconnectListenerCallback = (reason: DisconnectReason, description?: any) => void;

const SOCKET_NAMESPACE = '/invoices';

let socket: Socket | null = null;
let connectionPromise: Promise<Socket> | null = null;
let listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
let connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

// --- Tipos de Datos de Eventos --- 
export interface InvoiceStatusUpdateData {
  id: number;
  status: string;
  filename: string;
}

export interface InvoicePreviewUpdateData {
  id: number;
  preview_data: Record<string, any>; // O un tipo más específico si lo tienes
}

// --- Tipos de Listener --- 
type StatusUpdateListener = (data: InvoiceStatusUpdateData) => void;
type PreviewUpdateListener = (data: InvoicePreviewUpdateData) => void;
type ConnectListener = () => void;
type ConnectErrorListener = (error: Error) => void;

// --- Constantes de Nombres de Eventos (más seguro que strings) --- 
const Event = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    STATUS_UPDATE: 'invoice_status_update',
    PREVIEW_UPDATE: 'invoice_preview_updated',
    // Para gestión interna de listeners
    _INTERNAL_CONNECT: '_internal_connect',
    _INTERNAL_DISCONNECT: '_internal_disconnect',
    _INTERNAL_CONNECT_ERROR: '_internal_connect_error',
} as const;

// --- Funciones Auxiliares Internas --- 

function emitToListeners(eventName: string, ...args: any[]): void {
    listeners.get(eventName)?.forEach(listener => {
        try {
            listener(...args);
        } catch (error) {
            console.error(`[WS] Error ejecutando listener para ${eventName}:`, error);
        }
    });
}

function setupSocketListeners(socketInstance: Socket): void {
    // Limpiar listeners antiguos de la instancia de socket real
    socketInstance.offAny();
    socketInstance.removeAllListeners();

    socketInstance.on(Event.CONNECT, () => {
        // Este handler es para conexiones/reconexiones *después* de la inicial
        console.log(`[WS] Evento CONNECT recibido! ID: ${socketInstance.id}, Estado anterior: ${connectionState}`);
        if (connectionState !== 'connected') { // Evitar emitir múltiples veces si ya estaba conectado
           connectionState = 'connected';
           emitToListeners(Event._INTERNAL_CONNECT);
        }
    });

    // Usar el tipo explícito DisconnectListenerCallback
    const disconnectHandler: DisconnectListenerCallback = (reason, description) => {
        console.warn(`[WS] Evento DISCONNECT recibido. Razón: ${reason}`, description ? `(${JSON.stringify(description)})`: '');
        const wasConnected = connectionState === 'connected';
        connectionState = 'disconnected';
        emitToListeners(Event._INTERNAL_DISCONNECT, reason, description);
        // Resetear la promesa si la desconexión no es intencional por el cliente
        if (reason !== 'io client disconnect' && wasConnected) { // Solo resetear si estábamos conectados
            connectionPromise = null;
            socket = null; // Forzar nueva conexión la próxima vez
        }
    };
    socketInstance.on(Event.DISCONNECT, disconnectHandler);

    socketInstance.on(Event.CONNECT_ERROR, (error: Error) => {
        console.error(`[WS] Evento CONNECT_ERROR recibido:`, error);
        connectionState = 'error';
        emitToListeners(Event._INTERNAL_CONNECT_ERROR, error);
        connectionPromise = null; // Permitir reintentar la conexión
        socket = null;
    });

    socketInstance.on(Event.STATUS_UPDATE, (data: InvoiceStatusUpdateData) => {
        console.log(`[WS] Evento '${Event.STATUS_UPDATE}' recibido:`, data);
        emitToListeners(Event.STATUS_UPDATE, data);
    });

    socketInstance.on(Event.PREVIEW_UPDATE, (data: InvoicePreviewUpdateData) => {
        console.log(`[WS] Evento '${Event.PREVIEW_UPDATE}' recibido:`, data);
        emitToListeners(Event.PREVIEW_UPDATE, data);
    });

    // Log general para depuración
    socketInstance.onAny((eventName: string, ...args: any[]) => {
      if (![Event.CONNECT, Event.DISCONNECT, Event.CONNECT_ERROR, Event.STATUS_UPDATE, Event.PREVIEW_UPDATE].includes(eventName as any)) {
         console.log(`[WS] Evento ANY recibido: ${eventName}`, args);
      }
    });
}

// --- Funciones Públicas --- 

/**
 * Establece (o reutiliza) la conexión WebSocket y devuelve una promesa
 * que resuelve con la instancia del socket conectado.
 */
function ensureConnected(): Promise<Socket> {
    if (socket?.connected) {
        // Si ya está conectado, asegurarse que los listeners permanentes estén activos
        // y emitir el evento connect por si alguien se suscribió tarde.
        if (connectionState !== 'connected') { // Solo si el estado interno no estaba sincronizado
             console.log("[WS] ensureConnected: Ya conectado, sincronizando estado y listeners.");
             connectionState = 'connected';
             setupSocketListeners(socket); // Re-asegurar listeners permanentes
             emitToListeners(Event._INTERNAL_CONNECT); // Notificar a listeners tardíos
        }
        return Promise.resolve(socket);
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    console.log("[WS] ensureConnected: Iniciando proceso de conexión...");
    connectionState = 'connecting';

    connectionPromise = new Promise((resolve, reject) => {
        // Crear instancia si no existe
        if (!socket) {
            const socketUrl = getApiBaseUrl(); // Volver a la URL base
            const namespaceUrl = socketUrl + SOCKET_NAMESPACE; // <-- Construir URL con namespace
            console.log(`[WS] Creando nueva instancia de socket para ${namespaceUrl}...`);
            // Conectar directamente a la URL con el namespace
            socket = socketIO(namespaceUrl, { // <-- Usar namespaceUrl
                path: '/socket.io', // Ruta estándar
                transports: ['websocket'],
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
                autoConnect: false, 
                // El cliente debería manejar el namespace automáticamente
            });
        } else {
             console.log("[WS] Usando instancia de socket existente para conectar...");
        }

        // Limpiar listeners temporales previos por si acaso
        socket.off(Event.CONNECT);
        socket.off(Event.DISCONNECT);
        socket.off(Event.CONNECT_ERROR);

        // Listeners temporales
        const onConnect = () => {
            console.log("[WS] Conexión inicial establecida (listener temporal)");
            clearTimeout(timeoutId);
            socket?.off(Event.CONNECT, onConnect);
            socket?.off(Event.DISCONNECT, onDisconnect);
            socket?.off(Event.CONNECT_ERROR, onError);

            if (socket) {
                connectionState = 'connected';
                setupSocketListeners(socket);
                console.log("[WS] Listeners permanentes configurados.");
                emitToListeners(Event._INTERNAL_CONNECT);
                console.log("[WS] Evento _INTERNAL_CONNECT emitido.");
                resolve(socket);
            } else {
                connectionState = 'error';
                reject(new Error("[WS] Conectado pero la instancia del socket desapareció"));
            }
        };

        const onDisconnect: DisconnectListenerCallback = (reason, description) => {
             console.warn("[WS] Desconectado durante intento inicial (listener temporal)", reason, description);
             clearTimeout(timeoutId);
             socket?.off(Event.CONNECT, onConnect);
             socket?.off(Event.DISCONNECT, onDisconnect);
             socket?.off(Event.CONNECT_ERROR, onError);
             connectionState = 'disconnected';
             connectionPromise = null;
             socket = null;
             reject(new Error(`[WS] Desconectado durante intento inicial: ${reason}`));
         };
 
         const onError = (error: Error) => {
             console.error("[WS] Error durante intento inicial (listener temporal)", error);
             clearTimeout(timeoutId);
             socket?.off(Event.CONNECT, onConnect);
             socket?.off(Event.DISCONNECT, onDisconnect);
             socket?.off(Event.CONNECT_ERROR, onError);
             connectionState = 'error';
             connectionPromise = null;
             socket = null;
             reject(new Error(`[WS] Error de conexión inicial: ${error.message}`));
         };
 
         // Añadir listeners temporales
         socket.once(Event.CONNECT, onConnect);
         socket.once(Event.DISCONNECT, onDisconnect);
         socket.once(Event.CONNECT_ERROR, onError);
 
         // Timeout
         const timeoutId = setTimeout(() => {
              console.warn("[WS] Timeout de conexión inicial excedido.");
             socket?.off(Event.CONNECT, onConnect);
             socket?.off(Event.DISCONNECT, onDisconnect);
             socket?.off(Event.CONNECT_ERROR, onError);
             connectionState = 'error';
             connectionPromise = null;
             socket?.disconnect();
             socket = null;
             reject(new Error("[WS] Timeout de conexión inicial"));
         }, 10000);
 
         // Iniciar conexión explícitamente
         console.log("[WS] Llamando a socket.connect()...");
         socket.connect();

    });

    connectionPromise.catch(() => { /* No hacer nada aquí, los handlers ya resetean */ });

    return connectionPromise;
}

/**
 * Registra un listener para un evento específico.
 */
function addEventListener<T extends (...args: any[]) => void>(eventName: string, listener: T): void {
    if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
    }
    listeners.get(eventName)?.add(listener);
    console.log(`[WS] Listener añadido para ${eventName}. Total: ${listeners.get(eventName)?.size}`);
}

/**
 * Elimina un listener para un evento específico.
 */
function removeEventListener<T extends (...args: any[]) => void>(eventName: string, listener: T): void {
    listeners.get(eventName)?.delete(listener);
    console.log(`[WS] Listener eliminado para ${eventName}. Restantes: ${listeners.get(eventName)?.size}`);
    if (listeners.get(eventName)?.size === 0) {
        listeners.delete(eventName);
    }
}

// --- Exportaciones específicas por evento --- 

export function addStatusUpdateListener(listener: StatusUpdateListener): void {
    ensureConnected().catch(err => console.error("[WS] Falló la conexión al añadir listener de status", err));
    addEventListener(Event.STATUS_UPDATE, listener);
}
export function removeStatusUpdateListener(listener: StatusUpdateListener): void {
    removeEventListener(Event.STATUS_UPDATE, listener);
}

export function addPreviewUpdateListener(listener: PreviewUpdateListener): void {
    ensureConnected().catch(err => console.error("[WS] Falló la conexión al añadir listener de preview", err));
    addEventListener(Event.PREVIEW_UPDATE, listener);
}
export function removePreviewUpdateListener(listener: PreviewUpdateListener): void {
    removeEventListener(Event.PREVIEW_UPDATE, listener);
}

export function addConnectListener(listener: ConnectListener): void {
    // Si ya está conectado, llamar inmediatamente
    if (connectionState === 'connected') listener();
    addEventListener(Event._INTERNAL_CONNECT, listener);
}
export function removeConnectListener(listener: ConnectListener): void {
    removeEventListener(Event._INTERNAL_CONNECT, listener);
}

// Añadir listeners para disconnect y connect_error de forma similar si son necesarios
// Usar el tipo explícito DisconnectListenerCallback
export function addDisconnectListener(listener: DisconnectListenerCallback): void {
    addEventListener(Event._INTERNAL_DISCONNECT, listener);
}
export function removeDisconnectListener(listener: DisconnectListenerCallback): void {
    removeEventListener(Event._INTERNAL_DISCONNECT, listener);
}

export function addConnectErrorListener(listener: ConnectErrorListener): void {
    addEventListener(Event._INTERNAL_CONNECT_ERROR, listener);
}
export function removeConnectErrorListener(listener: ConnectErrorListener): void {
    removeEventListener(Event._INTERNAL_CONNECT_ERROR, listener);
}


/**
 * Se une a un room específico en el servidor.
 * @param roomName Nombre del room (ej: 'invoice_123')
 */
export async function joinRoom(roomName: string): Promise<void> {
    try {
        const connectedSocket = await ensureConnected();
        connectedSocket.emit('join', { room: roomName });
        console.log(`[WS] Solicitud para unirse al room: ${roomName}`);
    } catch (error) {
        console.error(`[WS] Error al intentar unirse al room ${roomName}:`, error);
        // Podrías querer reintentar o notificar al usuario
    }
}

/**
 * Abandona un room específico en el servidor.
 * @param roomName Nombre del room (ej: 'invoice_123')
 */
export async function leaveRoom(roomName: string): Promise<void> {
    // Es seguro intentar salir incluso si no estamos conectados
  if (socket?.connected) {
        socket.emit('leave', { room: roomName });
        console.log(`[WS] Solicitud para abandonar el room: ${roomName}`);
    } else {
         console.log(`[WS] No conectado, no se puede abandonar el room: ${roomName}`);
    }
    // No esperamos confirmación para 'leave'
}

/**
 * Desconecta el WebSocket y limpia todos los listeners.
 */
export function disconnect(): void {
    if (socket) {
        console.log("[WS] Desconectando y limpiando...");
    socket.disconnect();
    socket = null;
  }
    connectionPromise = null;
    listeners.clear();
    connectionState = 'disconnected';
}

/**
 * Obtiene la instancia actual del socket (puede ser null).
 * Usar con precaución, preferir ensureConnected().
 */
export function getRawSocket(): Socket | null {
  return socket;
}

/**
 * Verifica si el socket está actualmente conectado.
 */
export function isConnected(): boolean {
  return connectionState === 'connected';
}