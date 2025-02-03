/**
 * WebSocket composable for managing connections
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { WebSocketClient } from '@/api/websocket/client'
import type {
  WebSocketConfig,
  WebSocketStatus,
  WebSocketMessage,
  SubscriptionOptions
} from '@/api/websocket/types'

export function useWebSocket(config: WebSocketConfig) {
  const client = ref<WebSocketClient | null>(null)
  const status = ref<WebSocketStatus>({
    connected: false,
    connecting: false
  })

  // Initialize client
  const initialize = async () => {
    if (client.value) {
      await disconnect()
    }

    client.value = new WebSocketClient(config)
    
    // Set up status monitoring
    client.value.subscribe(
      { messageTypes: ['status', 'error'] },
      updateStatus
    )

    try {
      await connect()
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  // Connect to server
  const connect = async () => {
    if (!client.value) return

    try {
      await client.value.connect()
      status.value = client.value.getStatus()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      throw error
    }
  }

  // Disconnect from server
  const disconnect = async () => {
    if (!client.value) return

    client.value.disconnect()
    status.value = {
      connected: false,
      connecting: false
    }
  }

  // Subscribe to messages
  const subscribe = (
    options: SubscriptionOptions,
    handler: (message: WebSocketMessage) => void
  ) => {
    if (!client.value) {
      throw new Error('WebSocket client not initialized')
    }

    return client.value.subscribe(options, handler)
  }

  // Unsubscribe from messages
  const unsubscribe = (subscriptionId: string) => {
    if (!client.value) return
    client.value.unsubscribe(subscriptionId)
  }

  // Send message
  const send = (message: WebSocketMessage) => {
    if (!client.value) {
      throw new Error('WebSocket client not initialized')
    }

    client.value.send(message)
  }

  // Update connection status
  const updateStatus = (message: WebSocketMessage) => {
    if (!client.value) return

    status.value = client.value.getStatus()

    if (message.type === 'error') {
      console.error('WebSocket error:', message.data)
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    initialize()
  })

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    status,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    initialize
  }
}