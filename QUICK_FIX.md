# Quick WebSocket Fix untuk makmurbahagia.id

Error "reserved bits" = Cloudflare/proxy masalah.

## Solusi Cepat:

### 1. **Matikan Cloudflare Proxy**
- Login Cloudflare dashboard
- DNS Records → klik **orange cloud** jadi **grey cloud** 
- Wait 5 minutes

### 2. **Enable WebSocket di Cloudflare** (jika tetap pakai proxy)
- Network tab → **WebSocket: ON**
- SSL/TLS → Edge Certificates → **Always Use HTTPS: OFF**

### 3. **Atau Pindah Hosting**
```bash
# Deploy ke Railway (WebSocket guaranteed work)
npm install -g @railway/cli
railway login
railway init
railway up
```

### 4. **Test Fix**
Buka browser console, seharusnya tidak ada error lagi.

**Reserved bits error** = CDN/proxy issue, bukan code issue.