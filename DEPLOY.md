# Deployment Guide

## 🚀 Deploy to Different Platforms

### 1. Heroku
```bash
# Install Heroku CLI
heroku create your-chat-app
git add .
git commit -m "Initial commit"
git push heroku main

# Set environment variable
heroku config:set BASE_URL=https://your-chat-app.herokuapp.com
```

### 2. Railway
```bash
# Install Railway CLI
railway login
railway init
railway up

# Set environment variable in dashboard
BASE_URL=https://your-app.railway.app
```

### 3. Render
1. Connect GitHub repo
2. Choose "Web Service"
3. Build: `npm install`
4. Start: `npm start`
5. Set env var: `BASE_URL=https://your-app.onrender.com`

### 4. Vercel (Serverless)
```bash
npm i -g vercel
vercel

# Set environment variable
vercel env add BASE_URL production
```

### 5. VPS/Server
```bash
# Install PM2 for process management
npm install -g pm2

# Start app
pm2 start server.js --name chat-app

# Setup nginx reverse proxy (optional)
# Set BASE_URL environment variable
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `BASE_URL` | Public URL for QR codes | `https://yourdomain.com` |

## Notes
- WebSocket support required
- Node.js 16+ required
- No database needed (in-memory)