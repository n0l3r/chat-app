# Environment Files

File environment variables untuk konfigurasi server.

## Files

```
backend-node/
├── .env                # Your local config (ignored by git)
├── .env.example        # Template untuk setup
└── .gitignore         # Ignores .env
```

## Setup

1. **Copy template:**
```bash
cd backend-node
cp .env.example .env
```

2. **Edit .env file:**
```bash
# Default untuk local development
PORT=8080
BASE_URL=http://localhost:8080
NODE_ENV=development
```

3. **Production example:**
```bash
# Untuk deployment
PORT=3000
BASE_URL=https://your-domain.com
NODE_ENV=production
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `BASE_URL` | `http://localhost:8080` | Public URL untuk QR codes |
| `NODE_ENV` | `development` | Environment mode |

## Platform Examples

### Heroku
```bash
heroku config:set BASE_URL=https://your-app.herokuapp.com
heroku config:set NODE_ENV=production
```

### Railway
Set di Railway dashboard:
- `BASE_URL=https://your-app.railway.app`
- `NODE_ENV=production`

### Render
Set di Render dashboard:
- `BASE_URL=https://your-app.onrender.com` 
- `NODE_ENV=production`

## Important

- File `.env` sudah di-gitignore (tidak di-commit)
- Gunakan `.env.example` sebagai template
- BASE_URL harus sesuai domain deployment untuk QR codes