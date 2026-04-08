// Fallback transport methods for when WebSocket fails
class ChatTransport {
  constructor(token, userName, onMessage, onStatus) {
    this.token = token;
    this.userName = userName;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.connected = false;
    this.method = null;
    this.eventSource = null;
    this.pollInterval = null;
    this.lastMessageTime = 0;
  }

  async connect() {
    console.log('Attempting transport connection...');
    
    // Try WebSocket first
    try {
      await this.tryWebSocket();
      return;
    } catch (error) {
      console.log('WebSocket failed, trying SSE fallback');
    }

    // Try Server-Sent Events
    try {
      await this.trySSE();
      return;
    } catch (error) {
      console.log('SSE failed, trying HTTP polling');
    }

    // Try HTTP polling as last resort
    try {
      await this.tryPolling();
    } catch (error) {
      console.error('All transport methods failed:', error);
      this.onStatus(false, 'All connection methods failed');
    }
  }

  async tryWebSocket() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${this.token}?name=${encodeURIComponent(this.userName)}`;
      
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket timeout'));
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('WebSocket connected');
        this.ws = ws;
        this.method = 'websocket';
        this.connected = true;
        this.onStatus(true, 'Connected via WebSocket');
        resolve();
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.log('WebSocket error:', error);
        reject(error);
      };
      
      ws.onclose = (event) => {
        clearTimeout(timeout);
        this.connected = false;
        this.onStatus(false);
        
        // Don't reconnect if we're switching transports
        if (this.method === 'websocket') {
          reject(new Error(`WebSocket closed: ${event.code}`));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.onMessage(msg);
        } catch (e) {
          console.error('Invalid message format:', e);
        }
      };
    });
  }

  async trySSE() {
    return new Promise((resolve, reject) => {
      const sseUrl = `/sse/${this.token}?name=${encodeURIComponent(this.userName)}`;
      
      const eventSource = new EventSource(sseUrl);
      
      const timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('SSE timeout'));
      }, 8000);
      
      eventSource.onopen = () => {
        clearTimeout(timeout);
        console.log('SSE connected');
        this.eventSource = eventSource;
        this.method = 'sse';
        this.connected = true;
        this.onStatus(true, 'Connected via Server-Sent Events');
        resolve();
      };
      
      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        console.log('SSE error:', error);
        eventSource.close();
        reject(error);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.onMessage(msg);
        } catch (e) {
          console.error('Invalid SSE message format:', e);
        }
      };
    });
  }

  async tryPolling() {
    return new Promise((resolve, reject) => {
      console.log('Starting HTTP polling');
      this.method = 'polling';
      this.connected = true;
      this.onStatus(true, 'Connected via HTTP polling');
      
      this.pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/poll/${this.token}?since=${this.lastMessageTime}`);
          if (response.ok) {
            const data = await response.json();
            data.messages.forEach(msg => this.onMessage(msg));
            this.lastMessageTime = data.timestamp;
          } else {
            throw new Error(`Polling failed: ${response.status}`);
          }
        } catch (error) {
          console.error('Polling error:', error);
          this.disconnect();
          reject(error);
        }
      }, 2000); // Poll every 2 seconds
      
      resolve();
    });
  }

  async sendMessage(message) {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    if (this.method === 'websocket' && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'message',
        message: message,
        name: this.userName
      }));
    } else if (this.method === 'sse' || this.method === 'polling') {
      // Use HTTP POST for SSE/polling
      const response = await fetch(`/send/${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          name: this.userName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
    }
  }

  disconnect() {
    this.connected = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    this.onStatus(false);
  }

  getMethod() {
    return this.method;
  }
}