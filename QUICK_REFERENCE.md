# Production Deployment - Quick Commands Reference

## Files Provided

```
✅ backend/.env                          - Updated with production IP for CORS
✅ backend/.env.example                  - Template for developers
✅ frontend/.env.production              - Production environment for React
✅ nginx.conf                            - Reverse proxy configuration
✅ PRODUCTION_DEPLOYMENT_GUIDE.md        - Complete step-by-step guide
✅ DEPLOYMENT_CHECKLIST.md               - Quick reference checklist
✅ PRODUCTION_CONFIG_SUMMARY.md          - Overview of all changes
```

---

## Copy-Paste Commands for AWS EC2

### Step 1: SSH to EC2
```bash
ssh ubuntu@3.27.82.249
```

### Step 2: Update Backend Environment (Option A - Simple)
```bash
# Edit .env file (nano is built-in)
nano /path/to/.env

# Find CLIENT_URLS and update to:
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://localhost:3000,http://3.27.82.249,http://3.27.82.249:80

# Save: Ctrl+X → Y → Enter
```

### Step 3: Restart Backend
```bash
# Restart PM2 process
pm2 restart monitoring-backend

# Verify it's running
pm2 status

# Check for errors
pm2 logs monitoring-backend | head -20
```

### Step 4: Deploy Nginx Configuration
```bash
# Assuming you've copied nginx.conf to your server
sudo cp nginx.conf /etc/nginx/sites-available/mentoring-system

# Create symlink
sudo ln -s /etc/nginx/sites-available/mentoring-system /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Verify running
sudo systemctl status nginx
```

### Step 5: Build Frontend
```bash
# On your local machine
cd frontend
npm install
npm run build

# This creates 'dist' folder with optimized React build
```

### Step 6: Deploy Frontend to EC2
```bash
# Option A: Via SCP (from local machine)
scp -r frontend/dist/* ubuntu@3.27.82.249:/var/www/mentoring-system/

# Option B: Clone on EC2 and build there
ssh ubuntu@3.27.82.249
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/mentoring-system/
```

### Step 7: Verify Everything Works
```bash
# Test health check
curl http://3.27.82.249/health

# Expected: {"status":"ok"}

# Test API through Nginx
curl http://3.27.82.249/api/auth/login

# Test frontend access
curl http://3.27.82.249/ | head -20

# Should see React HTML structure
```

---

## Troubleshooting Quick Fixes

### Issue: CORS Error
```bash
# Verify CLIENT_URLS includes your IP/domain
grep CLIENT_URLS /path/to/.env

# If missing, add and restart
pm2 restart monitoring-backend
```

### Issue: 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Verify on port 4000
curl http://localhost:4000/health
```

### Issue: Frontend shows blank page
```bash
# Check if dist files are in correct location
ls -la /var/www/mentoring-system/

# Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log
```

### Issue: MongoDB connection error
```bash
# Check logs
pm2 logs monitoring-backend | grep -i mongo

# Verify credentials in .env
nano /path/to/.env
# Check MONGODB_URI and fallback
```

---

## Monitoring Commands

### Check PM2 Processes
```bash
pm2 list
pm2 status
pm2 logs monitoring-backend --lines 50
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -50 /var/log/nginx/access.log
sudo tail -50 /var/log/nginx/error.log
```

### Monitor System Resources
```bash
top
free -h
df -h
```

### Test API Connectivity
```bash
# Health check
curl -v http://3.27.82.249/health

# API endpoint
curl -X POST http://3.27.82.249/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Check response time
curl -w "\nTotal time: %{time_total}s\n" http://3.27.82.249/health
```

---

## Environment Variables Summary

### Backend (.env)
```env
# Changed
CLIENT_URLS=http://3.27.82.249,http://3.27.82.249:80

# Critical (verify these exist)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
RECAPTCHA_SECRET_KEY=...
```

### Frontend (.env.production)
```env
# Key settings
VITE_API_URL=http://3.27.82.249/api
VITE_WS_URL=ws://3.27.82.249
VITE_ENVIRONMENT=production
```

---

## Performance Tips

### Enable Gzip (already in nginx.conf)
Automatically compresses responses by ~80%

### Cache Control
Static files (JS, CSS) automatically cached for 7 days

### Connection Pooling
Nginx maintains up to 64 connections to backend

### WebSocket Support
Enabled for real-time features (chat, notifications)

---

## SSL/TLS Setup (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Update nginx.conf with SSL config (see commented section)
# Restart Nginx
sudo systemctl restart nginx
```

---

## Rollback Plan

If something breaks:

```bash
# Stop backend
pm2 stop monitoring-backend

# Restore from git
git checkout previous-commit

# Reinstall and restart
npm install
npm start
pm2 restart monitoring-backend

# Or restore specific .env
git checkout backend/.env
pm2 restart monitoring-backend
```

---

## Success Indicators ✅

- [ ] `pm2 status` shows "online" for monitoring-backend
- [ ] `curl http://3.27.82.249/health` returns `{"status":"ok"}`
- [ ] `curl http://3.27.82.249/` returns React HTML
- [ ] No CORS errors in browser console
- [ ] Login/register workflows complete successfully
- [ ] Real-time features (chat) work if enabled
- [ ] `sudo systemctl status nginx` shows "active (running)"

---

## Key Files Location on EC2

```
/path/to/backend/.env                    ← Database & CORS config
/path/to/backend/src/server.js           ← Express server
/etc/nginx/sites-available/mentoring-system   ← Nginx config
/etc/nginx/sites-enabled/                ← Nginx enabled sites
/var/www/mentoring-system                ← Frontend dist files
/var/log/nginx/access.log                ← Nginx access logs
/var/log/nginx/error.log                 ← Nginx error logs
```

---

**Status: ✅ All production configuration complete and ready for deployment**

For detailed step-by-step guide, see: PRODUCTION_DEPLOYMENT_GUIDE.md
For checklist, see: DEPLOYMENT_CHECKLIST.md
