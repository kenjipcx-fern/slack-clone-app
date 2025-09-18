import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'wss://slack-backend-morphvm-30337fn0.http.cloud.morph.so';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Message events
    this.socket.on('message:new', (data) => {
      this.emit('message:new', data);
    });

    this.socket.on('message:updated', (data) => {
      this.emit('message:updated', data);
    });

    this.socket.on('message:deleted', (data) => {
      this.emit('message:deleted', data);
    });

    // Reaction events
    this.socket.on('reaction:added', (data) => {
      this.emit('reaction:added', data);
    });

    this.socket.on('reaction:removed', (data) => {
      this.emit('reaction:removed', data);
    });

    // Typing events
    this.socket.on('user:typing', (data) => {
      this.emit('user:typing', data);
    });

    this.socket.on('user:stopped_typing', (data) => {
      this.emit('user:stopped_typing', data);
    });

    // Presence events
    this.socket.on('user:online', (data) => {
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data) => {
      this.emit('user:offline', data);
    });

    this.socket.on('user:status_changed', (data) => {
      this.emit('user:status_changed', data);
    });

    // Channel events
    this.socket.on('channel:created', (data) => {
      this.emit('channel:created', data);
    });

    this.socket.on('channel:updated', (data) => {
      this.emit('channel:updated', data);
    });

    this.socket.on('channel:deleted', (data) => {
      this.emit('channel:deleted', data);
    });

    this.socket.on('channel:member_joined', (data) => {
      this.emit('channel:member_joined', data);
    });

    this.socket.on('channel:member_left', (data) => {
      this.emit('channel:member_left', data);
    });

    // Huddle events
    this.socket.on('huddle:started', (data) => {
      this.emit('huddle:started', data);
    });

    this.socket.on('huddle:joined', (data) => {
      this.emit('huddle:joined', data);
    });

    this.socket.on('huddle:left', (data) => {
      this.emit('huddle:left', data);
    });

    this.socket.on('huddle:ended', (data) => {
      this.emit('huddle:ended', data);
    });

    this.socket.on('huddle:settings_updated', (data) => {
      this.emit('huddle:settings_updated', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Channel management
  joinChannel(channelId: string): void {
    if (this.socket) {
      this.socket.emit('channel:join', { channel_id: channelId });
    }
  }

  leaveChannel(channelId: string): void {
    if (this.socket) {
      this.socket.emit('channel:leave', { channel_id: channelId });
    }
  }

  // WebRTC signaling
  sendOffer(targetUserId: string, offer: any): void {
    if (this.socket) {
      this.socket.emit('webrtc:offer', { target_user_id: targetUserId, offer });
    }
  }

  sendAnswer(targetUserId: string, answer: any): void {
    if (this.socket) {
      this.socket.emit('webrtc:answer', { target_user_id: targetUserId, answer });
    }
  }

  sendIceCandidate(targetUserId: string, candidate: any): void {
    if (this.socket) {
      this.socket.emit('webrtc:ice_candidate', { target_user_id: targetUserId, candidate });
    }
  }

  // Typing indicators
  sendTyping(channelId: string): void {
    if (this.socket) {
      this.socket.emit('typing:start', { channel_id: channelId });
    }
  }

  stopTyping(channelId: string): void {
    if (this.socket) {
      this.socket.emit('typing:stop', { channel_id: channelId });
    }
  }

  // Send message (optional, can also use REST API)
  sendMessage(channelId: string, content: string, parentId?: string): void {
    if (this.socket) {
      this.socket.emit('message:send', {
        channel_id: channelId,
        content,
        parent_id: parentId,
      });
    }
  }

  // Update presence
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    if (this.socket) {
      this.socket.emit('presence:update', { status });
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
