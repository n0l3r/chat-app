let currentRoomId = null;

async function createRoom() {
  const btn = document.getElementById('createBtn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const res = await fetch('/api/room', { method: 'POST' });
    const data = await res.json();
    
    currentRoomId = data.room_id;
    
    document.getElementById('qrImage').src = data.qr_url;
    document.getElementById('roomIdDisplay').textContent = `Room: ${data.room_id}`;
    document.getElementById('roomResult').classList.remove('hidden');
    
  } catch (err) {
    alert('Failed to create room');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 5v14m-7-7h14"/>
      </svg>
      Create New Room
    `;
  }
}

function copyLink() {
  if (!currentRoomId) return;
  
  const link = `${window.location.origin}/chat.html?room=${currentRoomId}`;
  navigator.clipboard.writeText(link).then(() => {
    alert('Link copied!');
  }).catch(() => {
    prompt('Copy this link:', link);
  });
}

function openChat() {
  if (!currentRoomId) return;
  window.open(`/chat.html?room=${currentRoomId}`, '_blank');
}
