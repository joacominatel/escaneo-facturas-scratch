import { io as socketIO, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api/client";

// Definir explícitamente el tipo para DisconnectReason si la importación directa falla
type DisconnectReason = Parameters<Socket["on"]["call"]>[1];

const SOCKET_NAMESPACE = '/invoices';

let socket: Socket | null = null;

interface InvoiceStatusUpdateData {
  id: number;
  status: string;
  filename: string;
}

interface ConnectOptions {
  onConnect?: () => void;
  onDisconnect?: (reason: DisconnectReason) => void;
  onConnectError?: (error: Error) => void;
  onStatusUpdate?: (data: InvoiceStatusUpdateData) => void;
}

/**
 * Conecta al WebSocket de actualizaciones de facturas.
 * Si ya existe una conexión, la reutiliza.
 */
export function connectToInvoiceUpdates(options: ConnectOptions): Socket {
  if (socket?.connected) {
    console.log("[WS] Reutilizando conexión existente.");
    // Limpiar listeners antiguos antes de adjuntar nuevos (importante si las opciones cambian)
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('invoice_status_update');
    socket.offAny();
  } else {
    // Si no hay conexión, crear una nueva
    const socketUrl = getApiBaseUrl();
    console.log(`[WS] Creando nueva conexión a ${socketUrl} en namespace ${SOCKET_NAMESPACE}...`);
    socket = socketIO(socketUrl, {
      transports: ['websocket'],
      namespace: SOCKET_NAMESPACE,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      // autoConnect: true, // Es el valor por defecto
    });
    console.log(`[WS] Socket inicializado. Estado conectado: ${socket.connected}`);
  }

  // --- Registrar Listeners --- 
  // Siempre registrar listeners en la instancia actual del socket

  socket.on('connect', () => {
    // Este evento AHORA debería ser para el namespace /invoices
    console.log(`[WS] ¡Conectado exitosamente! ID: ${socket?.id}, Namespace: ${socket?.nsp}`);
    options.onConnect?.(); // Llamar al callback del usuario
  });

  socket.on('disconnect', (reason) => {
    console.warn(`[WS] Desconectado. Razón: ${reason}`);
    options.onDisconnect?.(reason); // Llamar al callback del usuario
  });

  socket.on('connect_error', (error) => {
    console.error(`[WS] Error de conexión:`, error);
    options.onConnectError?.(error); // Llamar al callback del usuario
  });

  const statusUpdateEventName = 'invoice_status_update';
  console.log(`[WS] Registrando listener para evento '${statusUpdateEventName}' en namespace ${socket.nsp}...`);
  socket.on(statusUpdateEventName, (data: InvoiceStatusUpdateData) => {
    console.log(`[WS] Evento '${statusUpdateEventName}' recibido:`, data);
    options.onStatusUpdate?.(data); // Llamar al callback del usuario
  });

  // Log general para cualquier evento
  socket.onAny((eventName: string, ...args: any[]) => {
    console.log(`[WS] Evento recibido en namespace '${socket?.nsp}': ${eventName}`, args);
  });

  // Si el socket no estaba conectado previamente, intentar conectar (autoConnect suele hacerlo)
  if (!socket.connected) {
     // socket.connect(); // Opcional: explícito si autoConnect=false o hay dudas
     console.log("[WS] Esperando conexión automática...");
  }

  return socket;
}

/**
 * Desconecta el WebSocket de actualizaciones de facturas.
 */
export function disconnectFromInvoiceUpdates(): void {
  if (socket?.connected) {
    console.log("Desconectando WebSocket...");
    socket.disconnect();
    socket.off(); // Limpiar listeners al desconectar manualmente
    socket = null;
  } else if (socket) {
    console.log("WebSocket existía pero no estaba conectado. Limpiando.");
    socket.off();
    socket = null;
  } else {
    console.log("WebSocket no inicializado.");
  }
}

/**
 * Obtiene la instancia actual del socket (puede ser null).
 */
export function getInvoiceSocket(): Socket | null {
  return socket;
}

/**
 * Verifica si el socket está actualmente conectado.
 */
export function isInvoiceSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// Definir una interfaz para los eventos esperados, mejora la seguridad de tipos en .on
// Esto puede necesitar ajustarse según los eventos reales emitidos por tu servidor
interface SocketEventMap {
  connect: () => void;
  disconnect: (reason: DisconnectReason) => void;
  connect_error: (error: Error) => void;
  invoice_status_update: (data: InvoiceStatusUpdateData) => void;
  // Añadir otros eventos si son necesarios
}