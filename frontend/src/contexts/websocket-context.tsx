"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { io as socketIO, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api/client";
import {
    addStatusUpdateListener as addWsStatusUpdateListener,
    removeStatusUpdateListener as removeWsStatusUpdateListener,
    addPreviewUpdateListener as addWsPreviewUpdateListener,
    removePreviewUpdateListener as removeWsPreviewUpdateListener,
    joinRoom as wsJoinRoom,
    leaveRoom as wsLeaveRoom,
    _setManagedSocket,
} from "@/lib/ws/invoice-updates";

// Tipos específicos si los necesitamos para pasar a los listeners globales
export type { InvoiceStatusUpdateData, InvoicePreviewUpdateData } from "@/lib/ws/invoice-updates";

// --- Tipos del Contexto ---
export interface WebSocketContextState {
    isConnected: boolean;
    connectError: Error | null;
    // Funciones expuestas para interactuar con el WS
    addStatusUpdateListener: typeof addWsStatusUpdateListener;
    removeStatusUpdateListener: typeof removeWsStatusUpdateListener;
    addPreviewUpdateListener: typeof addWsPreviewUpdateListener;
    removePreviewUpdateListener: typeof removeWsPreviewUpdateListener;
    joinRoom: typeof wsJoinRoom;
    leaveRoom: typeof wsLeaveRoom;
}

export const WebSocketContext = createContext<WebSocketContextState | undefined>(
    undefined
);

// --- Hook para usar el Contexto ---
export const useWebSocket = (): WebSocketContextState => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket debe ser usado dentro de un WebSocketProvider');
    }
    return context;
};

// --- Proveedor del Contexto ---
interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [connectError, setConnectError] = useState<Error | null>(null);

    useEffect(() => {
        console.log("[WebSocketProvider] Montado. Iniciando conexión...");

        const SOCKET_NAMESPACE = '/invoices';
        const socketUrl = getApiBaseUrl();
        const namespaceUrl = socketUrl + SOCKET_NAMESPACE;

        console.log(`[WebSocketProvider] Creando instancia de socket para ${namespaceUrl}...`);
        const socket = socketIO(namespaceUrl, {
            path: '/socket.io',
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
            autoConnect: false,
        });

        _setManagedSocket(socket);

        // --- Handlers Internos del Provider ---
        const onConnect = () => {
            console.log(`[WebSocketProvider] Conectado! ID: ${socket.id}`);
            setIsConnected(true);
            setConnectError(null);
        };

        const onDisconnect = (reason: Socket.DisconnectReason, description?: any) => {
            console.warn(`[WebSocketProvider] Desconectado. Razón: ${reason}`, description || '');
            setIsConnected(false);
            setConnectError(null);
            if (reason === "io server disconnect") {
                // Opcional: intentar reconectar si el servidor nos desconecta
                 // socket.connect(); 
            }
        };

        const onConnectError = (error: Error) => {
            console.error('[WebSocketProvider] Error de conexión:', error);
            setIsConnected(false);
            setConnectError(error);
        };

        // --- Setup de Listeners del Socket ---
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        console.log("[WebSocketProvider] Llamando a socket.connect()...");
        socket.connect();

        // --- Limpieza al Desmontar ---
        return () => {
            console.log("[WebSocketProvider] Desmontando. Desconectando socket...");
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            
            socket.disconnect();
            
            _setManagedSocket(null);
            
            setIsConnected(false);
            setConnectError(null);
        };

    }, []);

    // --- Valor del Contexto ---
    const contextValue: WebSocketContextState = {
        isConnected,
        connectError,
        addStatusUpdateListener: addWsStatusUpdateListener,
        removeStatusUpdateListener: removeWsStatusUpdateListener,
        addPreviewUpdateListener: addWsPreviewUpdateListener,
        removePreviewUpdateListener: removeWsPreviewUpdateListener,
        joinRoom: wsJoinRoom,
        leaveRoom: wsLeaveRoom,
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
}; 