# Quick Deployment Checklist

## Pre-Deployment
- [ ] Verify MongoDB connection is working (run health check)
- [ ] Confirm PM2 process is running: `pm2 status`
- [ ] All backend tests passing: `npm test`
- [ ] Frontend build created: `npm run build` in frontend folder

## Backend Setup on EC2
- [ ] SSH into EC2: `ssh ubuntu@3.27.82.249`
- [ ] Update .env with new CLIENT_URLS including production IP/domain
- [ ] Restart PM2: `pm2 restart monitoring-backend`
- [ ] Verify health check: `curl http://3.27.82.249:4000/health`
- [ ] Check logs for errors: `pm2 logs monitoring-backend`

## Nginx Setup on EC2
- [ ] Copy nginx.conf to `/etc/nginx/sites-available/mentoring-system`
- [ ] Create symlink: `sudo ln -s /etc/nginx/sites-available/mentoring-system /etc/nginx/sites-enabled/`
- [ ] Test config: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Verify Nginx is running: `sudo systemctl status nginx`

## Frontend Deployment on EC2
- [ ] Create web directory: `sudo mkdir -p /var/www/mentoring-system`
- [ ] Copy built frontend files: `cp -r dist/* /var/www/mentoring-system/`
- [ ] Or set up PM2 for dev server: `pm2 start "npm run dev" --name "mentoring-frontend"`
- [ ] Update Nginx config to serve frontend (see guide)
- [ ] Restart Nginx: `sudo systemctl restart nginx`

## Post-Deployment Verification
- [ ] Test health check via Nginx: `curl http://3.27.82.249/health`
- [ ] Test API endpoint: `curl http://3.27.82.249/api/<endpoint>`
- [ ] Test frontend access: `curl http://3.27.82.249/` (check for React HTML)
- [ ] Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Verify API requests from frontend work (browser dev tools)

## Optional - SSL/TLS Setup
- [ ] Install Certbot: `sudo apt-get install certbot python3-certbot-nginx`
- [ ] Obtain certificate: `sudo certbot certonly --nginx -d yourdomain.com`
- [ ] Update Nginx config with SSL directives
- [ ] Enable automatic renewal: `sudo systemctl enable certbot.timer`

## Success Indicators
✅ Health check responds with `{"status":"ok"}`
✅ Frontend loads and displays UI
✅ API requests from frontend succeed (no CORS errors)
✅ Login/authentication works end-to-end
✅ No 502 Bad Gateway errors in Nginx
✅ MongoDB operations work (login, register, etc.)
✅ PM2 processes are stable and auto-restart on failure
