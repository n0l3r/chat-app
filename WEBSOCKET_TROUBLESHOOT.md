# WebSocket Hosting Issues & Solutions

## Common Problems

### 1. **Always Reconnecting**
Penyebab:
- Hosting provider tidak support WebSocket dengan baik  
- Proxy/load balancer memblokir WS connections
- HTTPS/HTTP protokol mismatch
- Session timeout terlalu pendek

### 2. **Platform-Specific Issues**

#### Vercel
❌ **TIDAK SUPPORT WebSocket** di serverless functions
✅ **Solusi**: Gunakan Pusher, Ably, atau Socket.IO dengan polling fallback

#### Netlify
❌ **TIDAK SUPPORT WebSocket** di functions  
✅ **Solusi**: Gunakan external WebSocket service

#### Heroku (Free/Hobby)
⚠️ **Partial Support** - connection timeout 30s
✅ **Solusi**: Implementasi heartbeat ping

#### Railway 
✅ **Full Support** - Works well with WebSocket

#### Render
✅ **Full Support** - Good WebSocket support

#### VPS/Dedicated
✅ **Full Support** - Complete control

### 3. **Recommended Platforms**

**Best for WebSocket:**
1. **Railway** - Excellent WebSocket support
2. **Render** - Good WebSocket handling  
3. **VPS** (DigitalOcean, Linode) - Full control
4. **Heroku Paid** - Reliable with longer timeouts

**Avoid for WebSocket:**
- Vercel (serverless limitation)
- Netlify Functions (no persistent connections)

### 4. **Debugging Steps**

1. **Check browser console:**
```javascript
// Add to chat.js for debugging
console.log('Connecting to:', wsUrl);
ws.onopen = () => console.log('Connected');
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
ws.onerror = (e) => console.error('Error:', e);
```

2. **Test WebSocket manually:**
```bash
# Test if WebSocket endpoint responds
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://your-domain.com/ws/test123
```

3. **Check server logs** untuk connection errors

### 5. **Alternative Solutions**

Jika WebSocket tidak bisa, implementasi polling fallback:

```javascript
// Fallback ke HTTP polling jika WebSocket gagal
function tryWebSocket() {
  // Try WebSocket first
  const ws = new WebSocket(wsUrl);
  
  setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      // Fallback to polling
      startPolling();
    }
  }, 5000);
}
```

### 6. **Platform Migration**

Jika hosting bermasalah:
1. Export project ke GitHub
2. Deploy ke Railway/Render  
3. Update BASE_URL di environment
4. Test WebSocket connection

**Railway Deploy:**
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

**Render Deploy:**
1. Connect GitHub repo
2. Choose "Web Service"  
3. Build: `npm install`
4. Start: `npm start`