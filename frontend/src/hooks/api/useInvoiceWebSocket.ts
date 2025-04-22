"use client"

import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { getEnv } from "@/lib/env"

interface WebSocketEvent {
  invoice_id: number
  progress: number
  event: string
}

export function useInvoiceWebSocket(invoiceId: number | null) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<WebSocketEvent[]>([])
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null)

  // Inicializar conexión WebSocket
  useEffect(() => {
    if (!invoiceId) return

    // Obtener la URL del backend
    const { BACKEND_URL } = getEnv()
    
    // Crear conexión al namespace /invoices usando la URL del backend
    const socketInstance = io(`${BACKEND_URL}/invoices`)

    socketInstance.on("connect", () => {
      console.log("WebSocket conectado")
      setConnected(true)

      // Suscribirse al canal específico de la factura
      socketInstance.emit("subscribe", `invoice_progress_${invoiceId}`)
    })

    socketInstance.on("disconnect", () => {
      console.log("WebSocket desconectado")
      setConnected(false)
    })

    // Escuchar eventos de progreso
    socketInstance.on(`invoice_progress_${invoiceId}`, (data: WebSocketEvent) => {
      console.log("Evento recibido:", data)
      setLastEvent(data)
      setEvents((prev) => [...prev, data])
    })

    setSocket(socketInstance)

    // Limpiar al desmontar
    return () => {
      if (socketInstance) {
        socketInstance.off(`invoice_progress_${invoiceId}`)
        socketInstance.disconnect()
      }
    }
  }, [invoiceId])

  // Función para desconectar manualmente
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [socket])

  return {
    connected,
    events,
    lastEvent,
    disconnect,
  }
}
