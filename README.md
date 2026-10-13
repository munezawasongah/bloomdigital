# 🌸 Bloom — Flower Garden Greetings Platform

A production-ready web platform that lets users send beautiful animated flower gardens
to loved ones via WhatsApp. Built with Node.js/Express and a
persistent JSON store. **Free to use — no payment or sign-up required.**

---

## Features

- 4-step wizard: Names → Message → Customise → Preview & Share (free)
- Shareable garden links (`/garden/:shareId`)
- WhatsApp deep-link sharing (no API key needed) or targeted share to a number
- 10 colour themes, 6 flower styles, density control
- Touch: flowers pop and scatter on tap
- Persistent gardens stored in JSON (swap to Postgres/MySQL easily)

---

## Quick Start (local)

```bash
# 1. Clone / unzip the project
cd bloom

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials (see below)

# 4. Start
npm start
# → http://localhost:3000
```

---

## Environment Variables (.env)

| Variable | Description |
|---|---|
| `PORT` | Port to listen on (default 3000) |
| `BASE_URL` | Public URL of your deployment e.g. `https://bloom.up.railway.app` |
| `ADMIN_PASSWORD` | Password for the `/admin?key=...` dashboard |

---

## Deploy to Railway (recommended — free tier available)

1. Push to GitHub:
```bash
git init
git add .
git commit -m "bloom launch"
gh repo create bloom --public --push
```

2. Go to **https://railway.app** → New Project → Deploy from GitHub → select your repo

3. Add environment variables in Railway dashboard (Settings → Variables):
   - Set `BASE_URL` (your Railway URL) and `ADMIN_PASSWORD`

4. Railway will auto-detect Node.js, run `npm start`, and give you a public URL

5. Update `BASE_URL` in Railway variables with your Railway URL

---

## Deploy to Render (alternative)

1. Push to GitHub (same as above)
2. Go to **https://render.com** → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables in Render dashboard

---

## Deploy to VPS (e.g. DigitalOcean / Hetzner)

```bash
# On your server
sudo apt update && sudo apt install nodejs npm nginx -y
git clone <your-repo> /var/www/bloom
cd /var/www/bloom && npm install

# Create .env (see .env.example)
nano .env

# Run with PM2
npm install -g pm2
pm2 start server.js --name bloom
pm2 save && pm2 startup

# Nginx config: /etc/nginx/sites-available/bloom
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}

# SSL (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/garden` | Create a new garden → returns `{id, shareId}` |
| `GET` | `/api/garden/:shareId` | Fetch garden data |
| `GET` | `/api/garden/:shareId/whatsapp?phone=254XXXXXXXXX` | Get WhatsApp share link |

---

## Upgrading the Database

The default store is a local JSON file (`db/gardens.json`). For production with multiple
instances, swap `lowdb` for a real database:

**PostgreSQL (recommended):**
```bash
npm install pg
```
Replace `lowdb` usage in `server.js` and routes with `pg` queries.
Railway and Render both offer free Postgres add-ons.

---

## WhatsApp Sharing — How It Works

No WhatsApp Business API key is required for basic sharing.

The app generates a `wa.me` deep-link:
```
https://wa.me/254XXXXXXXXX?text=<encoded message with garden link>
```

When the sender clicks **"Send via WhatsApp"**, WhatsApp opens with the message
pre-filled. The recipient gets a link like:
```
https://bloom.up.railway.app/garden/a1b2c3d4
```

Opening that link shows them the full animated garden with their name, the custom
message, and the chosen colour theme — no login required.

---

## Folder Structure

```
bloom/
├── server.js           ← Express entry point
├── routes/
│   ├── garden.js       ← Garden CRUD + WhatsApp link
│   └── admin.js        ← Admin stats dashboard
├── public/
│   └── index.html      ← Full frontend (wizard + canvas garden)
├── db/
│   └── gardens.json    ← Auto-created JSON store
├── .env.example
├── Procfile
├── railway.json
└── package.json
```

---

## Support

Built with ❤ using the Bloom platform.
