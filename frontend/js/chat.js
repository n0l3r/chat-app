let transport = null;
let userName = '';
let token = '';

// Get token from URL path /c/TOKEN
const pathParts = window.location.pathname.split('/');
token = pathParts[pathParts.length - 1];

if (!token) {
  alert('Invalid link');
  window.location.href = '/';
}

document.getElementById('roomBadge').textContent = 'Chat Room';

// Handle Enter key on name input
document.getElementById('nameInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinChat();
});

// Handle Enter key on message input
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function joinChat() {
  const input = document.getElementById('nameInput');
  userName = input.value.trim() || 'Anonymous';
  
  document.getElementById('nameModal').classList.add('hidden');
  document.getElementById('chatContainer').classList.remove('hidden');
  
  // Use new transport system with fallback
  transport = new ChatTransport(
    token,
    userName,
    renderMessage, // onMessage callback
    updateStatus   // onStatus callback
  );
  
  transport.connect();
}

function updateStatus(connected, message = null) {
  const statusEl = document.getElementById('connectionStatus');
  const methodEl = document.getElementById('connectionMethod');
  
  if (connected) {
    statusEl.textContent = 'Connected';
    statusEl.className = 'connected';
    hideConnectionError();
    
    if (transport) {
      const method = transport.getMethod();
      const methodName = {
        'websocket': 'WebSocket',
        'sse': 'Server-Sent Events',
        'polling': 'HTTP Polling'
      }[method] || method;
      
      if (methodEl) {
        methodEl.textContent = `via ${methodName}`;
        methodEl.style.display = 'inline';
      }
    }
  } else {
    statusEl.textContent = message || 'Disconnected';
    statusEl.className = 'disconnected';
    
    if (methodEl) {
      methodEl.style.display = 'none';
    }
    
    if (message && message.includes('failed')) {
      showConnectionError(message);
    }
  }
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  
  if (!message || !transport || !transport.connected) {
    return;
  }
  
  try {
    await transport.sendMessage(message);
    input.value = '';
  } catch (error) {
    console.error('Failed to send message:', error);
    showConnectionError('Failed to send message');
  }
}

function showConnectionError(message) {
  const errorDiv = document.getElementById('connectionError') || createErrorDiv();
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function hideConnectionError() {
  const errorDiv = document.getElementById('connectionError');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

function createErrorDiv() {
  const div = document.createElement('div');
  div.id = 'connectionError';
  div.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #fee2e2;
    color: #dc2626;
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid #fecaca;
    font-size: 0.875rem;
    z-index: 1000;
    max-width: 90%;
    text-align: center;
    display: none;
  `;
  document.body.appendChild(div);
  return div;
}

function renderMessage(msg) {
  const messageList = document.getElementById('messageList');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  
  if (msg.type === 'system') {
    messageDiv.classList.add('system');
    messageDiv.innerHTML = `<span class="content">${escapeHtml(msg.content || msg.message)}</span>`;
  } else {
    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="name">${escapeHtml(msg.name)}</span>
        <span class="time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="content">${escapeHtml(msg.message)}</div>
    `;
  }
  
  messageList.appendChild(messageDiv);
  
  // Auto-scroll to bottom
  messageList.scrollTop = messageList.scrollHeight;
  
  // Keep max 100 messages
  while (messageList.children.length > 100) {
    messageList.removeChild(messageList.firstChild);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
