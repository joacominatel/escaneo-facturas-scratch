/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { Socket } from "socket.io-client";
// Eliminamos la importación de socketIO, getApiBaseUrl, y la lógica de conexión global

// Definir DisconnectReason (sigue siendo útil)
export type DisconnectReason = Socket["disconnect"] extends (reason: infer R, ...args: any[]) => any ? R : string;
// Definir un tipo para el listener de desconexión (sigue siendo útil)
export type DisconnectListenerCallback = (reason: DisconnectReason, description?: any) => void;

// Mantenemos una referencia al socket gestionado por el Provider
// Esta referencia será establecida por el Provider
let managedSocket: Socket | null = null;

/**
 * Establece la instancia del socket gestionado.
 * SOLO debe ser llamada por WebSocketProvider.
 * @internal
 */
export function _setManagedSocket(socketInstance: Socket | null): void {
    managedSocket = socketInstance;
    if (socketInstance) {
        console.log("[WS Lib] Socket gestionado establecido.");
        // Podríamos re-adjuntar listeners genéricos si fuera necesario aquí,
        // pero es mejor que el Provider maneje los suyos y los componentes los suyos.
        setupGenericListeners(socketInstance); // Adjuntar listeners de eventos de datos
    } else {
        console.log("[WS Lib] Socket gestionado limpiado.");
    }
}

/**
 * Obtiene la instancia del socket gestionado.
 * Útil internamente y quizás para depuración.
 */
export function getManagedSocket(): Socket | null {
  return managedSocket;
}

// --- Tipos de Datos de Eventos (sin cambios) ---
export interface InvoiceStatusUpdateData {
    id: number;
    status: string;
    filename: string;
}

export interface InvoicePreviewUpdateData {
    id: number;
    preview_data: Record<string, any>; // O un tipo más específico si lo tienes
}

// --- Tipos de Listener (sin cambios) ---
export type StatusUpdateListener = (data: InvoiceStatusUpdateData) => void;
export type PreviewUpdateListener = (data: InvoicePreviewUpdateData) => void;
// Ya no necesitamos ConnectListener, ConnectErrorListener aquí para uso público general

// --- Constantes de Nombres de Eventos --- 
// Mantenemos los nombres de eventos públicos
export const Event = {
    // CONNECT: 'connect', // Gestionado por el provider
    // DISCONNECT: 'disconnect', // Gestionado por el provider
    // CONNECT_ERROR: 'connect_error', // Gestionado por el provider
    STATUS_UPDATE: 'invoice_status_update',
    PREVIEW_UPDATE: 'invoice_preview_updated',
    JOIN: 'join', // Para join/leave room
    LEAVE: 'leave'
} as const;

// --- Gestión Simplificada de Listeners --- 
// Usaremos un Map local para seguir la pista de los listeners añadidos
// a través de nuestras funciones, para poder quitarlos correctamente.
const activeListeners = new Map<string, Map<Function, Function>>(); // eventName -> listenerOriginal -> listenerRealEnSocket

function setupGenericListeners(socketInstance: Socket): void {
    // Limpiar listeners de datos previos en esta instancia específica
    socketInstance.off(Event.STATUS_UPDATE);
    socketInstance.off(Event.PREVIEW_UPDATE);

    // Listener para STATUS_UPDATE
    socketInstance.on(Event.STATUS_UPDATE, (data: InvoiceStatusUpdateData) => {
        console.log(`[WS Lib] Evento '${Event.STATUS_UPDATE}' recibido:`, data);
        // Emitir a los listeners registrados a través de addStatusUpdateListener
        activeListeners.get(Event.STATUS_UPDATE)?.forEach((_, listener) => {
             try {
                 (listener as StatusUpdateListener)(data);
             } catch (error) {
                 console.error(`[WS Lib] Error en listener ${Event.STATUS_UPDATE}:`, error);
             }
         });
    });

    // Listener para PREVIEW_UPDATE
    socketInstance.on(Event.PREVIEW_UPDATE, (data: InvoicePreviewUpdateData) => {
        console.log(`[WS Lib] Evento '${Event.PREVIEW_UPDATE}' recibido:`, data);
        // Emitir a los listeners registrados a través de addPreviewUpdateListener
         activeListeners.get(Event.PREVIEW_UPDATE)?.forEach((_, listener) => {
             try {
                 (listener as PreviewUpdateListener)(data);
             } catch (error) {
                 console.error(`[WS Lib] Error en listener ${Event.PREVIEW_UPDATE}:`, error);
             }
         });
    });
    
    // Podríamos tener un onAny para debug si quisiéramos
    // socketInstance.onAny((eventName: string, ...args: any[]) => {
    //   if (eventName !== Event.STATUS_UPDATE && eventName !== Event.PREVIEW_UPDATE) {
    //      console.log(`[WS Lib] Evento ANY recibido: ${eventName}`, args);
    //   }
    // });
}

// --- Funciones Públicas Simplificadas --- 

// Ya no necesitamos ensureConnected
// Ya no necesitamos los add/remove para Connect, Disconnect, ConnectError (manejados por Provider)
// Ya no necesitamos isConnected (estado en Provider)
// Ya no necesitamos disconnect (manejado por Provider)

/**
 * Registra un listener para actualizaciones de estado de factura.
 */
export function addStatusUpdateListener(listener: StatusUpdateListener): void {
    if (!managedSocket) {
        console.warn("[WS Lib] Intento de añadir listener de estado sin socket gestionado.");
        return;
    }
    if (!activeListeners.has(Event.STATUS_UPDATE)) {
        activeListeners.set(Event.STATUS_UPDATE, new Map());
    }
    if (!activeListeners.get(Event.STATUS_UPDATE)!.has(listener)) {
        // Guardamos el listener original para poder quitarlo después
        activeListeners.get(Event.STATUS_UPDATE)!.set(listener, listener); 
        console.log(`[WS Lib] Listener añadido para ${Event.STATUS_UPDATE}. Total: ${activeListeners.get(Event.STATUS_UPDATE)?.size}`);
        // No necesitamos añadirlo al socket aquí porque setupGenericListeners ya escucha
    } else {
         console.log(`[WS Lib] Listener para ${Event.STATUS_UPDATE} ya estaba añadido.`);
    }
}

/**
 * Elimina un listener de actualizaciones de estado de factura.
 */
export function removeStatusUpdateListener(listener: StatusUpdateListener): void {
    const eventListeners = activeListeners.get(Event.STATUS_UPDATE);
    if (eventListeners?.has(listener)) {
        eventListeners.delete(listener);
        console.log(`[WS Lib] Listener eliminado para ${Event.STATUS_UPDATE}. Restantes: ${eventListeners.size}`);
        if (eventListeners.size === 0) {
            activeListeners.delete(Event.STATUS_UPDATE);
        }
        // No necesitamos quitarlo del socket aquí
    } else {
         console.log(`[WS Lib] Intento de eliminar listener no encontrado para ${Event.STATUS_UPDATE}.`);
    }
}

/**
 * Registra un listener para actualizaciones de previsualización de factura.
 */
export function addPreviewUpdateListener(listener: PreviewUpdateListener): void {
    if (!managedSocket) {
        console.warn("[WS Lib] Intento de añadir listener de preview sin socket gestionado.");
        return;
    }
     if (!activeListeners.has(Event.PREVIEW_UPDATE)) {
        activeListeners.set(Event.PREVIEW_UPDATE, new Map());
    }
    if (!activeListeners.get(Event.PREVIEW_UPDATE)!.has(listener)) {
        activeListeners.get(Event.PREVIEW_UPDATE)!.set(listener, listener);
        console.log(`[WS Lib] Listener añadido para ${Event.PREVIEW_UPDATE}. Total: ${activeListeners.get(Event.PREVIEW_UPDATE)?.size}`);
    } else {
         console.log(`[WS Lib] Listener para ${Event.PREVIEW_UPDATE} ya estaba añadido.`);
    }
}

/**
 * Elimina un listener de actualizaciones de previsualización de factura.
 */
export function removePreviewUpdateListener(listener: PreviewUpdateListener): void {
    const eventListeners = activeListeners.get(Event.PREVIEW_UPDATE);
    if (eventListeners?.has(listener)) {
        eventListeners.delete(listener);
        console.log(`[WS Lib] Listener eliminado para ${Event.PREVIEW_UPDATE}. Restantes: ${eventListeners.size}`);
        if (eventListeners.size === 0) {
            activeListeners.delete(Event.PREVIEW_UPDATE);
        }
    } else {
         console.log(`[WS Lib] Intento de eliminar listener no encontrado para ${Event.PREVIEW_UPDATE}.`);
    }
}

/**
 * Se une a un room específico en el servidor.
 * @param roomName Nombre del room (ej: 'invoice_123')
 */
export async function joinRoom(roomName: string): Promise<void> {
    if (!managedSocket?.connected) {
        console.warn(`[WS Lib] No se puede unir al room ${roomName}: Socket no conectado.`);
        // Podríamos lanzar un error o simplemente no hacer nada
         // throw new Error("Socket no conectado");
         return; 
    }
    try {
        managedSocket.emit(Event.JOIN, { room: roomName });
        console.log(`[WS Lib] Solicitud para unirse al room: ${roomName}`);
    } catch (error) {
        console.error(`[WS Lib] Error al emitir join para room ${roomName}:`, error);
        // Re-lanzar o manejar el error como sea apropiado
        throw error;
    }
}

/**
 * Abandona un room específico en el servidor.
 * @param roomName Nombre del room (ej: 'invoice_123')
 */
export async function leaveRoom(roomName: string): Promise<void> {
    if (!managedSocket?.connected) {
        // Es menos crítico no poder salir de un room si no estás conectado
        console.log(`[WS Lib] No conectado, no se puede abandonar el room: ${roomName}`);
        return;
    }
     try {    
        managedSocket.emit(Event.LEAVE, { room: roomName });
        console.log(`[WS Lib] Solicitud para abandonar el room: ${roomName}`);
     } catch (error) {
         console.error(`[WS Lib] Error al emitir leave para room ${roomName}:`, error);
         // Podríamos decidir no lanzar error aquí
     }
}