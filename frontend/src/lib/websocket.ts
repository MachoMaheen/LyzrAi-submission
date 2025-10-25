import type { Poll } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export class WebSocketManager {
  private ws: WebSocket | null = null
  private pollId: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Set<(poll: Poll) => void> = new Set()
  private pingInterval: NodeJS.Timeout | null = null

  connect(pollId: number, token: string) {
    this.pollId = pollId
    const url = `${WS_URL}/ws/polls/${pollId}?token=${token}`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log(`WebSocket connected to poll ${pollId}`)
        this.reconnectAttempts = 0
        
        // Start ping interval
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping')
          }
        }, 30000)
      }

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return
        
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'vote_update' || message.type === 'like_update') {
            this.listeners.forEach((listener) => listener(message.data))
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        if (this.pingInterval) {
          clearInterval(this.pingInterval)
          this.pingInterval = null
        }
        this.attemptReconnect(token)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  private attemptReconnect(token: string) {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      this.pollId !== null
    ) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      
      setTimeout(() => {
        if (this.pollId) {
          this.connect(this.pollId, token)
        }
      }, delay)
    }
  }

  subscribe(callback: (poll: Poll) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.listeners.clear()
    this.pollId = null
    this.reconnectAttempts = 0
  }
}

export const createWebSocketManager = () => new WebSocketManager()
