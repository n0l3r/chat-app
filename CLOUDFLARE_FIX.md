# Cloudflare/CDN WebSocket Fix

Error "reserved bits are on" biasanya terjadi karena proxy/CDN tidak support WebSocket dengan baik.

## Quick Fixes

### 1. **Cloudflare Settings** (jika pakai Cloudflare)

Di Cloudflare Dashboard:
1. **SSL/TLS** → Edge Certificates → **Disable "Always Use HTTPS"** untuk WebSocket endpoints
2. **Network** → **Enable "WebSocket"** 
3. **Speed** → Optimization → **Disable "Auto Minify"** untuk HTML/CSS/JS
4. **Caching** → Configuration → **Set Bypass Cache** untuk `/ws/*` paths

### 2. **Server Headers** (tambahkan ke server.js)

```javascript
// Add WebSocket headers middleware
app.use((req, res, next) => {
  if (req.url.startsWith('/ws')) {
    res.setHeader('Upgrade', 'websocket');
    res.setHeader('Connection', 'Upgrade');
    res.setHeader('Sec-WebSocket-Version', '13');
  }
  next();
});
```

### 3. **nginx Configuration** (jika pakai nginx)

```nginx
location /ws/ {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

### 4. **Alternative Hosting**

**Guaranteed WebSocket Support:**
- **Railway** - Best for Node.js WebSocket
- **Render** - Good WebSocket handling
- **Heroku** (paid plans) - Reliable 
- **DigitalOcean App Platform** - Works well

**Problematic:**
- Shared hosting dengan Cloudflare default
- Some Vercel configurations  
- Netlify (functions don't support persistent connections)

### 5. **Test WebSocket Manually**

```bash
# Test if WebSocket handshake works
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  https://makmurbahagia.id/ws/test123
```

Should return `101 Switching Protocols`, not `200 OK`.

### 6. **Domain Configuration**

Jika menggunakan custom domain, pastikan:
- DNS A record langsung ke server (bukan melalui proxy)
- Atau gunakan subdomain khusus untuk WebSocket: `ws.makmurbahagia.id`

### 7. **Hosting Provider Settings**

**Hostinger/cPanel:**
1. Disable Cloudflare proxy (orange cloud → grey cloud)
2. Enable WebSocket di hosting control panel

**Railway:**
```bash
# Deploy to Railway (recommended)
railway login
railway init
railway up
# Set domain di Railway dashboard
```