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
    console.log("WebSocket ya conectado.");
    // Si reutilizamos, podríamos querer actualizar los listeners,
    // pero por ahora, simplemente devolvemos el existente.
    // Considera una lógica más robusta si los handlers cambian.
    return socket;
  }

  const socketUrl = getApiBaseUrl();
  console.log(`Intentando conectar WebSocket a ${socketUrl} en namespace ${SOCKET_NAMESPACE}...`);

  // Desconectar y limpiar listeners antiguos
  if (socket) {
    socket.disconnect();
    socket.off();
  }

  // Conectar
  socket = socketIO(socketUrl, {
    path: '/socket.io/',
    transports: ['websocket'],
    // Considera añadir `reconnectionAttempts: 3` o similar si quieres limitar los reintentos
  });

  // Registrar listeners
  // Usamos un mapeo para facilitar la gestión si reutilizamos el socket
  const listeners = {
    connect: options.onConnect,
    disconnect: options.onDisconnect,
    connect_error: options.onConnectError,
    invoice_status_update: options.onStatusUpdate,
  };

  // Adjuntar listeners que se proporcionaron
  Object.entries(listeners).forEach(([event, handler]) => {
    if (handler) {
      // Castear explícitamente los tipos para el listener
      socket?.on(event as keyof SocketEventMap, handler as (...args: any[]) => void);
    }
  });

  // Log general
  socket.onAny((eventName: string, ...args: any[]) => {
    console.log(`WebSocket event received: ${eventName}`, args);
  });

  console.log("Socket inicializado, esperando conexión...");
  // La conexión suele ser automática a menos que autoConnect sea false

  // Devolver el socket creado (puede no estar conectado aún)
  // Es importante que el código que llama maneje el estado de conexión
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