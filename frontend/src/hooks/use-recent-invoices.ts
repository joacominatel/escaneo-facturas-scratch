import { useState, useEffect, useCallback, useRef } from 'react'
import io from 'socket.io-client'
import { fetchRecentInvoices } from '@/lib/api/invoices'
import { getApiBaseUrl } from '@/lib/api/client'
import type { InvoiceListItem, InvoiceStatus } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'
import type { Socket } from 'socket.io-client'

type WebSocketStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

interface UseRecentInvoicesProps {
  limit?: number
}

interface UseRecentInvoicesReturn {
  invoices: InvoiceListItem[]
  isLoading: boolean
  error: ApiError | Error | null
  isLive: boolean
  wsStatus: WebSocketStatus
  toggleLive: () => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
}

export function useRecentInvoices({ limit = 5 }: UseRecentInvoicesProps = {}): UseRecentInvoicesReturn {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [isLive, setIsLive] = useState<boolean>(false)
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected')
  const socketRef = useRef<typeof Socket | null>(null)

  const fetchInitialInvoices = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedInvoices = await fetchRecentInvoices(limit)
      setInvoices(fetchedInvoices)
    } catch (err) {
      console.error("Error fetching initial recent invoices:", err)
      setError(err instanceof ApiError || err instanceof Error ? err : new Error('An unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }
    
    setWsStatus('connecting')
    
    // Clean up existing socket instance if necessary
    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
    }

    const apiUrl = getApiBaseUrl()
    // Replace http/https with ws/wss for WebSocket connection
    const wsUrl = apiUrl.replace(/^http/, 'ws') 

    // Assuming default namespace '/' and standard Socket.IO path
    // Adjust namespace ('/invoices') and path if backend configuration differs
    // The documentation mentions namespace '/invoices', let's use that.
    // Flask-SocketIO often uses '/socket.io/' path by default. Let's try without explicit path first.
    console.log(`Attempting to connect WebSocket to ${wsUrl} with namespace /invoices`)
    // Connect to the namespace by appending it to the URL. Use the default path.
    socketRef.current = io(`${wsUrl}/invoices`, { // Connect to the /invoices namespace via URL
      path: '/socket.io/', // Use the default Socket.IO path
      transports: ['websocket'], // Explicitly use WebSocket
      // autoConnect: false, // Let's connect manually below
      reconnectionAttempts: 3, // Limit reconnection attempts
      // namespace: '/invoices', // Specify the namespace - io() takes namespace as 2nd arg normally, but here seems part of URL path logic often
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('WebSocket connected successfully to /invoices namespace.')
      setWsStatus('connected')
    })

    socket.on('connect_error', (err: Error) => {
      console.error('WebSocket connection error:', err)
      setWsStatus('error')
      setError(new Error(`WebSocket connection failed: ${err.message}`))
      // Optional: Attempt cleanup or notify user further
      socket.disconnect() // Stop trying if connection error occurs
    })

    socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason)
      // Only set to 'disconnected' if it wasn't an error state leading here
      if (wsStatus !== 'error') {
         setWsStatus('disconnected')
      }
      // If disconnection was not intentional (e.g., server issue), maybe set isLive to false?
      // setIsLive(false); // Consider this based on desired UX
    })

    socket.on('invoice_status_update', (data: { id: number; status: InvoiceStatus; filename: string }) => {
      console.log('Received invoice_status_update:', data)
      setInvoices((currentInvoices) =>
        currentInvoices.map((invoice) =>
          invoice.id === data.id ? { ...invoice, status: data.status } : invoice
        )
        // Potentially add logic here to insert *new* invoices if they are recent enough
        // For now, just updating existing ones in the list.
      )
    })
    
    // Manually initiate connection if not auto-connecting
    // socket.connect(); // If using autoConnect: false

  }, [wsStatus]) // Dependency: wsStatus to prevent reconnect loops on error state change

  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket.')
      socketRef.current.disconnect()
      socketRef.current.removeAllListeners(); // Clean up listeners
      socketRef.current = null
      setWsStatus('disconnected')
      // Keep error state if disconnection was due to an error? Or clear it?
      // setError(null); // Optional: Clear error on manual disconnect
    }
  }, [])


  // Effect for initial data load
  useEffect(() => {
    fetchInitialInvoices()
  }, [fetchInitialInvoices])

  // Effect to manage WebSocket connection based on isLive state
  useEffect(() => {
    if (isLive) {
      connectWebSocket()
    } else {
      disconnectWebSocket()
    }
    // Cleanup function to disconnect socket when component unmounts or isLive changes to false
    return () => {
        // Ensure disconnect is called on unmount IF socket still exists
        if (socketRef.current && socketRef.current.connected) {
             disconnectWebSocket();
        }
    }
  }, [isLive, connectWebSocket, disconnectWebSocket])

  const toggleLive = useCallback(() => {
    setIsLive((prev) => !prev)
  }, [])

  return { invoices, isLoading, error, isLive, wsStatus, toggleLive, connectWebSocket, disconnectWebSocket }
} 