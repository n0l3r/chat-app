let ws = null;
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
  
  connectWebSocket();
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/${token}?name=${encodeURIComponent(userName)}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    updateStatus(true);
  };
  
  ws.onclose = () => {
    updateStatus(false);
    setTimeout(connectWebSocket, 3000);
  };
  
  ws.onerror = () => {
    updateStatus(false);
  };
  
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    renderMessage(msg);
  };
}

function updateStatus(online) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  
  if (online) {
    dot.classList.remove('offline');
    text.textContent = 'Connected';
  } else {
    dot.classList.add('offline');
    text.textContent = 'Reconnecting...';
  }
}

function renderMessage(msg) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  
  if (msg.type === 'system') {
    div.className = 'message system';
    div.textContent = msg.content;
  } else {
    const isSelf = msg.name === userName;
    div.className = `message ${isSelf ? 'self' : 'other'}`;
    
    div.innerHTML = `
      ${!isSelf ? `<div class="name">${escapeHtml(msg.name)}</div>` : ''}
      <div class="content">${escapeHtml(msg.content)}</div>
      <div class="time">${msg.timestamp}</div>
    `;
  }
  
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  
  if (!content || !ws || ws.readyState !== WebSocket.OPEN) return;
  
  ws.send(JSON.stringify({ content }));
  input.value = '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
