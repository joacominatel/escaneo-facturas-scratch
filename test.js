document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('log');

    function logMessage(message, type = 'info') {
        console.log(`[WebSocket ${type.toUpperCase()}]:`, message);
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.classList.add('log-entry', type);
        entry.innerHTML = `<time>${time}</time> ${message}`;
        logContainer.appendChild(entry);
        // Scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // --- Connection Configuration ---
    const SOCKET_URL = 'ws://localhost:8010'; // Your backend URL
    const NAMESPACE = '/invoices';            // The namespace you want to connect to
    // -------------------------------

    logMessage(`Attempting to connect to ${SOCKET_URL}${NAMESPACE}...`);

    // Connect to the specified namespace
    // We explicitly specify the path and transports based on previous debugging
    const socket = io(SOCKET_URL, {
        path: '/socket.io/',         // Standard path for Socket.IO
        transports: ['websocket'], // Force WebSocket transport
        // Note: The namespace is often implicitly handled by the URL path if structured like io(SOCKET_URL + NAMESPACE)
        // but specifying it directly in the URL or options might depend on server config and client library version.
        // Let's try connecting directly to the namespace URL first, which is common:
        // const socket = io(`${SOCKET_URL}${NAMESPACE}`, { transports: ['websocket'] });
        // Reverting to the more explicit method based on our setup:
    });

    // --- Event Listeners ---

    socket.on('connect', () => {
        logMessage(`Successfully connected to namespace ${NAMESPACE}. Socket ID: ${socket.id}`, 'connect');
    });

    socket.on('disconnect', (reason) => {
        logMessage(`Disconnected: ${reason}`, 'disconnect');
        if (reason === 'io server disconnect') {
            // The server intentionally disconnected the socket
            socket.connect(); // Attempt to reconnect if appropriate
        }
    });

    socket.on('connect_error', (error) => {
        logMessage(`Connection Error: ${error.message || error}`, 'error');
        console.error('Connection Error Details:', error);
    });

    // Listen for your custom event
    socket.on('invoice_status_update', (data) => {
        logMessage(`Received 'invoice_status_update': ${JSON.stringify(data)}`, 'message');
    });

    // Example of listening to standard events (optional)
    socket.onAny((eventName, ...args) => {
      if (eventName !== 'invoice_status_update') { // Avoid double logging our custom event
        logMessage(`Received event '${eventName}': ${JSON.stringify(args)}`, 'info');
      }
    });

    logMessage('Socket.IO initialized. Waiting for connection events...');

}); 