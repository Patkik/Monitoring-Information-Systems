# Production Deployment Guide

## Overview
This document provides step-by-step instructions for deploying the Mentoring System backend and frontend to AWS EC2 with PM2 and Nginx.

**Current Setup:**
- Backend: Running on AWS EC2 (3.27.82.249:4000)
- Database: MongoDB Atlas with resilient SRV + fallback strategy
- PM2: Managing Node.js process
- Nginx: Reverse proxy configuration ready

---

## Prerequisites
- SSH access to AWS EC2 instance (ubuntu@3.27.82.249)
- PM2 installed on EC2
- Nginx installed on EC2
- Node.js and npm installed on EC2
- MongoDB Atlas account with credentials

---

## Backend Deployment

### 1. Update Backend Environment Variables

```bash
# SSH into your EC2 instance
ssh ubuntu@3.27.82.249

# Edit the .env file on your server
nano ~/.env  # Or wherever you keep the .env file

# Ensure these CORS settings are configured:
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://localhost:3000,http://3.27.82.249,http://3.27.82.249:80

# Or if using a domain:
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://localhost:3000,http://yourdomain.com,http://yourdomain.com:80

# Save and exit (Ctrl+X, then Y, then Enter)
```

### 2. Verify MongoDB Connection

```bash
# Test MongoDB connection by running health check
curl http://3.27.82.249:4000/health

# Expected response:
# {"status":"ok"}
```

### 3. Restart Backend with New Environment

```bash
# Restart the PM2 process to apply new environment variables
pm2 restart monitoring-backend

# Verify the process is running
pm2 status

# Check logs for any errors
pm2 logs monitoring-backend
```

---

## Nginx Configuration

### 1. Deploy Nginx Configuration

```bash
# SSH into EC2 (if not already connected)
ssh ubuntu@3.27.82.249

# Copy the nginx.conf file to the correct location
sudo cp nginx.conf /etc/nginx/sites-available/mentoring-system

# Create a symlink to sites-enabled
sudo ln -s /etc/nginx/sites-available/mentoring-system /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration will be successful
```

### 2. Start or Restart Nginx

```bash
# Start Nginx if not running
sudo systemctl start nginx

# Or restart if already running
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### 3. Test API Access via Nginx

```bash
# Test health check through Nginx (port 80)
curl http://3.27.82.249/health

# Test API endpoint through Nginx
curl http://3.27.82.249/api/auth/health  # Or any available endpoint

# Both should respond successfully
```

---

## Frontend Deployment

### 1. Build the Frontend

```bash
# On your local machine or build server
cd frontend

# Install dependencies (if not done recently)
npm install

# Build for production
npm run build

# This creates a 'dist' folder with the optimized React build
```

### 2. Serve Frontend via Nginx

Option A: **Serve React build through Nginx (recommended)**

```bash
# SSH into EC2
ssh ubuntu@3.27.82.249

# Create web directory
sudo mkdir -p /var/www/mentoring-system
sudo chown ubuntu:ubuntu /var/www/mentoring-system

# Copy built frontend files to Nginx directory
# (From local machine, or if frontend is cloned on EC2:)
cd frontend
npm run build
cp -r dist/* /var/www/mentoring-system/

# Update Nginx config to serve React SPA
# Add to /etc/nginx/sites-available/mentoring-system:

server {
    listen 80;
    server_name 3.27.82.249;
    
    root /var/www/mentoring-system;
    index index.html;
    
    # API proxy (existing config)
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # React SPA: serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Restart Nginx
sudo systemctl restart nginx
```

Option B: **Run React dev server on separate port (development)**

```bash
# SSH into EC2
ssh ubuntu@3.27.82.249

# Navigate to frontend directory
cd frontend

# Run dev server with PM2
pm2 start "npm run dev" --name "mentoring-frontend"

# Verify it's running
pm2 status

# Add Nginx location block for frontend:
location / {
    proxy_pass http://localhost:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 3. Update Frontend Environment for Production

```bash
# Before building, update the frontend/.env or .env.production:
VITE_API_URL=http://3.27.82.249/api
VITE_ENVIRONMENT=production

# Or use environment variables during build:
VITE_API_URL=http://3.27.82.249/api npm run build
```

---

## Post-Deployment Verification

### 1. Test Backend API
```bash
# Health check
curl http://3.27.82.249/health

# Try a login endpoint
curl -X POST http://3.27.82.249/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### 2. Test Frontend Access
```bash
# Open in browser or curl
curl http://3.27.82.249/

# Should return the HTML of the React application
```

### 3. Monitor Logs
```bash
# Backend logs
pm2 logs monitoring-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Issue: CORS Error
**Solution:** Ensure CLIENT_URLS in backend/.env includes the frontend URL:
```bash
CLIENT_URLS=http://3.27.82.249,http://yourdomain.com
pm2 restart monitoring-backend
```

### Issue: Nginx 502 Bad Gateway
**Solution:** Verify backend is running:
```bash
pm2 status
curl http://localhost:4000/health
```

### Issue: MongoDB Connection Fails
**Solution:** Check MongoDB connection string in .env:
```bash
# Verify credentials and network access
pm2 logs monitoring-backend | grep -i mongo
```

### Issue: Frontend Shows Blank/404 Page
**Solution:** Ensure React build is in correct location and Nginx config has try_files directive

---

## SSL/TLS Setup (Optional)

For HTTPS (recommended for production):

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d 3.27.82.249  # Or your domain

# Update Nginx config with SSL directives (see commented section in nginx.conf)
# Then restart Nginx
sudo systemctl restart nginx
```

---

## Performance Optimization

### Enable Gzip Compression
Already configured in nginx.conf. Restart Nginx to activate:
```bash
sudo systemctl restart nginx
```

### Set Cache Headers
```bash
# For static files (add to Nginx location block):
add_header Cache-Control "public, max-age=31536000" always;
```

### Monitor Performance
```bash
# Check system resources
top

# Monitor Nginx
curl http://3.27.82.249:8080/nginx_status  # If status module enabled
```

---

## Database Backup

```bash
# MongoDB Atlas backups are automatic, but you can also:
# 1. Use Atlas's built-in backup/restore features
# 2. Perform manual exports:
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/dbname"
```

---

## Rollback Plan

If deployment fails:
```bash
# Rollback backend
git revert <commit-hash>
npm install
pm2 restart monitoring-backend

# Rollback frontend
cd frontend
git revert <commit-hash>
npm run build
cp -r dist/* /var/www/mentoring-system/
```

---

## Maintenance

### Regular Updates
```bash
# Update PM2
npm install -g pm2
pm2 update

# Update Node.js
# Plan for downtime as needed

# Update system packages
sudo apt-get update && sudo apt-get upgrade
```

### Log Rotation
```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
```

---

## Support & Next Steps

- **Domain Setup:** Update .env with your domain instead of IP after DNS is configured
- **SSL Certificate:** Add Let's Encrypt HTTPS for security
- **Monitoring:** Set up CloudWatch or similar for alerting
- **Database:** Consider AWS Backup for automatic MongoDB backups
- **Load Balancing:** If scaling, set up AWS ELB/ALB in front of Nginx
