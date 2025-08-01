// WebSocket client for communicating with desktop companion
class CompanionClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  connect() {
    try {
      console.log('Connecting to desktop companion...');
      this.ws = new WebSocket('ws://localhost:8080');
      
      this.ws.onopen = () => {
        console.log('Connected to desktop companion');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send ping to verify connection
        this.send({ type: 'PING' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from desktop companion');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };

    } catch (error) {
      console.error('Failed to connect to desktop companion:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached. Desktop companion not available.');
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.log('WebSocket not connected, cannot send message');
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'PONG':
        console.log('Desktop companion is responsive');
        break;
        
      case 'PRESENCE_UPDATED':
        console.log('Presence updated via desktop companion');
        break;
        
      case 'PRESENCE_CLEARED':
        console.log('Presence cleared via desktop companion');
        break;
        
      default:
        console.log('Unknown message from desktop companion:', data);
    }
  }

  updatePresence(songInfo) {
    this.send({
      type: 'UPDATE_PRESENCE',
      songInfo: songInfo
    });
  }

  clearPresence() {
    this.send({
      type: 'CLEAR_PRESENCE'
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanionClient;
} 