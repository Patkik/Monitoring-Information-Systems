# 🚀 Free-Tier Deployment Guide (Vercel + Render + MongoDB Atlas)

**Total Cost: $0/month | Time to Deploy: ~30 minutes**

---

## 📋 Prerequisites Checklist

- [ ] GitHub account with repository access
- [ ] MongoDB Atlas account (free)
- [ ] Render account (free)
- [ ] Vercel account (free)
- [ ] All third-party API keys (Google OAuth, Pusher, Cloudinary, SMTP)

---

## 🗂️ STEP 1: Environment Variables Reference

### Backend Environment Variables (Node.js/Express)

Create `.env` file in `/backend` folder with these values:

```env
# ════════════════════════════════════════════════════════════════
# DATABASE
# ════════════════════════════════════════════════════════════════
# Copy from MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?appName=MentoringSystem
# Fallback (optional)
MONGODB_URI_FALLBACK=

# Connection retry settings
MONGODB_CONNECT_RETRIES=5
MONGODB_CONNECT_BACKOFF_MS=1000

# ════════════════════════════════════════════════════════════════
# SECURITY & JWT
# ════════════════════════════════════════════════════════════════
# Generate: openssl rand -base64 32
JWT_SECRET=your-32-char-min-random-secret-key-here-change-me
SESSION_SECRET=your-32-char-min-random-secret-key-here-change-me
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
# Disable reCAPTCHA for free tier testing
RECAPTCHA_DISABLED=false

# ════════════════════════════════════════════════════════════════
# SERVER CONFIGURATION
# ════════════════════════════════════════════════════════════════
NODE_ENV=production
PORT=4000
# For Render: https://your-app-name.onrender.com
SERVER_URL=https://your-backend-app.onrender.com
# For local: http://localhost:4000
API_BASE_URL=https://your-backend-app.onrender.com

# ════════════════════════════════════════════════════════════════
# CORS - CRITICAL FOR VERCEL FRONTEND
# ════════════════════════════════════════════════════════════════
# Add your Vercel frontend URL here
# Format: https://your-app-name.vercel.app
# For testing: http://localhost:5173,http://localhost:3000
CLIENT_URLS=https://your-app-name.vercel.app,http://localhost:5173
CLIENT_URL=https://your-app-name.vercel.app

# ════════════════════════════════════════════════════════════════
# OAUTH CREDENTIALS
# ════════════════════════════════════════════════════════════════
# Get from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://your-backend-app.onrender.com/api/integrations/google-calendar/callback

# Get from: https://developers.facebook.com/
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# ════════════════════════════════════════════════════════════════
# REAL-TIME NOTIFICATIONS (Pusher)
# ════════════════════════════════════════════════════════════════
# Get from: https://pusher.com/ (free tier)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=ap1

# ════════════════════════════════════════════════════════════════
# FILE UPLOADS (Cloudinary)
# ════════════════════════════════════════════════════════════════
# Get from: https://cloudinary.com/ (free tier: 25GB/month)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ════════════════════════════════════════════════════════════════
# EMAIL CONFIGURATION (SMTP)
# ════════════════════════════════════════════════════════════════
# Using Gmail: https://myaccount.google.com/apppasswords
# Generate app-specific password for Gmail, don't use your main password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password-from-google
SMTP_FROM_EMAIL=noreply@mentoring-system.com
SMTP_FROM_NAME=Mentoring System

# ════════════════════════════════════════════════════════════════
# FEATURE FLAGS
# ════════════════════════════════════════════════════════════════
FEATURE_FEEDBACK_ENABLED=true
FEATURE_CERTIFICATES_ENABLED=true
FEATURE_CHAT_ENABLED=true

# ════════════════════════════════════════════════════════════════
# LOGGING & ADMIN
# ════════════════════════════════════════════════════════════════
LOG_LEVEL=info
ADMIN_EMAIL=admin@mentoring-system.com
ADMIN_PASSWORD=change-me-to-strong-password-32-chars-min

# ════════════════════════════════════════════════════════════════
# GOOGLE CALENDAR INTEGRATION
# ════════════════════════════════════════════════════════════════
# Generate: openssl rand -hex 32
CALENDAR_TOKEN_SECRET=your-32-char-hex-key-for-calendar-token-encryption
```

### Frontend Environment Variables (React/Vite)

Create `.env.production` file in `/frontend` folder with these values:

```env
# ════════════════════════════════════════════════════════════════
# API CONFIGURATION
# ════════════════════════════════════════════════════════════════
# For Render backend: https://your-backend-app.onrender.com/api
# For local testing: http://localhost:4000/api
VITE_API_URL=https://your-backend-app.onrender.com/api

# WebSocket URL (optional)
VITE_WS_URL=

# ════════════════════════════════════════════════════════════════
# reCAPTCHA (Public Key - safe to expose)
# ════════════════════════════════════════════════════════════════
# Get from: https://www.google.com/recaptcha/admin
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# ════════════════════════════════════════════════════════════════
# PUSHER (Public Key - safe to expose)
# ════════════════════════════════════════════════════════════════
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=ap1

# ════════════════════════════════════════════════════════════════
# FEATURE FLAGS
# ════════════════════════════════════════════════════════════════
VITE_FEATURE_FEEDBACK_ENABLED=true
VITE_FEATURE_CERTIFICATES_ENABLED=true
VITE_FEATURE_CHAT_ENABLED=true
VITE_FEATURE_ANALYTICS_ENABLED=false

# ════════════════════════════════════════════════════════════════
# APPLICATION METADATA
# ════════════════════════════════════════════════════════════════
VITE_APP_NAME=Mentoring System
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# ════════════════════════════════════════════════════════════════
# ANALYTICS (Optional)
# ════════════════════════════════════════════════════════════════
# VITE_GOOGLE_ANALYTICS_ID=
# VITE_SENTRY_DSN=
```

---

## 🗄️ STEP 2: MongoDB Atlas Setup (5 minutes)

### 2.1 Create MongoDB Atlas Account
1. Go to **mongodb.com/cloud/atlas**
2. Click **"Sign Up"** → Create account (free)
3. Click **"Create"** → Select **M0 (forever free tier)**
4. Choose region closest to your users
5. Wait for cluster to deploy (2-3 minutes)

### 2.2 Get Connection String
1. Click **"Connect"** button
2. Select **"Drivers"**
3. Choose **"Node.js"** driver
4. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/databasename?retryWrites=true&w=majority
   ```
5. Replace:
   - `username` → Your database user
   - `password` → Your database password
   - `databasename` → `mentoring_system`

### 2.3 Add IP to Allowlist (CRITICAL)
1. Go to **Network Access** → **IP Allowlist**
2. Click **"Add IP Address"**
3. Add **0.0.0.0/0** (allow all for free tier)
   - ⚠️ **Note**: For production, whitelist specific IPs only
4. Confirm

✅ **You now have**: `MONGODB_URI` value

---

## ⚙️ STEP 3: Render Backend Deployment (10 minutes)

### 3.1 Create Render Account
1. Go to **render.com**
2. Click **"Sign Up"** → Connect with **GitHub**
3. Authorize GitHub access

### 3.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select your **GitHub repository**
3. Fill in settings:

| Field | Value |
|-------|-------|
| **Name** | `mentoring-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

4. Click **"Advanced"** → **"Add Environment Variable"**

### 3.3 Add Backend Environment Variables

Copy all variables from **Backend Environment Variables** section above into Render dashboard:

| Variable | Value | Notes |
|----------|-------|-------|
| MONGODB_URI | Your MongoDB connection string | From Step 2.2 |
| JWT_SECRET | Generate random string | `openssl rand -base64 32` |
| SESSION_SECRET | Generate random string | Different from JWT_SECRET |
| NODE_ENV | `production` | Required |
| PORT | `4000` | Don't change |
| SERVER_URL | `https://mentoring-backend.onrender.com` | Render will generate this |
| CLIENT_URLS | `https://your-frontend.vercel.app` | Add Vercel URL here |
| GOOGLE_CLIENT_ID | From Google OAuth | See "Get API Keys" section |
| GOOGLE_CLIENT_SECRET | From Google OAuth | See "Get API Keys" section |
| PUSHER_APP_ID | From Pusher | See "Get API Keys" section |
| PUSHER_KEY | From Pusher | See "Get API Keys" section |
| PUSHER_SECRET | From Pusher | See "Get API Keys" section |
| CLOUDINARY_CLOUD_NAME | From Cloudinary | See "Get API Keys" section |
| CLOUDINARY_API_KEY | From Cloudinary | See "Get API Keys" section |
| CLOUDINARY_API_SECRET | From Cloudinary | See "Get API Keys" section |
| SMTP_USER | Your Gmail address | See "Get API Keys" section |
| SMTP_PASSWORD | Google app password | See "Get API Keys" section |

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for green checkmark ✅ (2-3 minutes)
3. Copy your Render URL: `https://mentoring-backend.onrender.com`

✅ **You now have**: Backend deployed to Render

---

## 🎨 STEP 4: Vercel Frontend Deployment (10 minutes)

### 4.1 Create Vercel Account
1. Go to **vercel.com**
2. Click **"Sign Up"** → Connect with **GitHub**
3. Authorize GitHub access

### 4.2 Create Project
1. Click **"Add New"** → **"Project"**
2. Select your **GitHub repository**
3. Fill in settings:

| Field | Value |
|-------|-------|
| **Project Name** | `mentoring-frontend` |
| **Root Directory** | `frontend` |
| **Framework** | `Vite` |

4. Click **"Advanced"** → **"Add Environment Variable"**

### 4.3 Add Frontend Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| VITE_API_URL | `https://mentoring-backend.onrender.com/api` | Your Render backend URL |
| VITE_PUSHER_KEY | Your Pusher key | From Pusher dashboard |
| VITE_PUSHER_CLUSTER | `ap1` | Same as backend |
| VITE_RECAPTCHA_SITE_KEY | Your reCAPTCHA site key | From Google Console |
| VITE_APP_NAME | `Mentoring System` | Display name |
| VITE_ENVIRONMENT | `production` | Production mode |

### 4.4 Deploy
1. Click **"Deploy"**
2. Wait for green checkmark ✅ (1-2 minutes)
3. Copy your Vercel URL: `https://your-app-name.vercel.app`

✅ **You now have**: Frontend deployed to Vercel

---

## 🔑 STEP 5: Get API Keys

### Google OAuth (5 min)
1. Go to **console.cloud.google.com**
2. Create new project → name it "Mentoring System"
3. Go to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client ID** (Web Application)
5. Authorized redirect URIs:
   - `https://your-backend.onrender.com/api/auth/google/callback`
   - `http://localhost:4000/api/auth/google/callback` (for local dev)
6. Copy **Client ID** and **Client Secret**

### Pusher (5 min)
1. Go to **pusher.com**
2. Create free account → Create app
3. Choose region: **Asia-Pacific (ap1)**
4. Copy: **App ID**, **Key**, **Secret**

### Cloudinary (5 min)
1. Go to **cloudinary.com**
2. Sign up free
3. Dashboard → Copy: **Cloud Name**, **API Key**, **API Secret**

### Gmail App Password (5 min)
1. Go to **myaccount.google.com/apppasswords**
2. Select **Mail** → **Windows Computer** (or your device)
3. Google generates app-specific password
4. Copy the password (use this for SMTP_PASSWORD, NOT your Gmail password)

### reCAPTCHA (5 min)
1. Go to **google.com/recaptcha/admin**
2. Create new site
3. Choose **reCAPTCHA v2** (I'm not a robot)
4. Add domains:
   - `your-app-name.vercel.app`
   - `localhost:5173` (for local dev)
5. Copy **Site Key** (frontend) and **Secret Key** (backend)

---

## 🧪 STEP 6: Test Deployment

### 6.1 Test Frontend Loads
```bash
# Open in browser
https://your-app-name.vercel.app
```
- Page should load ✅
- Check browser console (F12) for errors ❌

### 6.2 Test Backend Health
```bash
# Check backend is running
curl https://mentoring-backend.onrender.com/health

# Should return:
# {"status":"ok"}
```

### 6.3 Test Database Connection
1. Open frontend app
2. Try to **Sign Up** or **Log In**
3. Should successfully save user to MongoDB
4. Check MongoDB Atlas dashboard → Collections → see new users

### 6.4 Test API Communication
```bash
# In browser console (F12):
fetch('https://mentoring-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Should log: {status: "ok"}
```

---

## ⚠️ COMMON ISSUES & FIXES

### Issue: "Cannot GET /api"
**Cause**: Frontend trying to reach wrong backend URL
**Fix**: 
1. Check `VITE_API_URL` in Vercel env vars
2. Should be: `https://mentoring-backend.onrender.com/api`
3. Re-deploy frontend after fixing

### Issue: Render cold start takes 30-50 seconds
**Cause**: Normal behavior for free tier
**Fix**: This is expected! Free Render services sleep after 15 min inactivity.

### Issue: MongoDB connection refused
**Cause**: IP not in allowlist or connection string wrong
**Fix**:
1. Check MongoDB IP Allowlist includes `0.0.0.0/0`
2. Verify `MONGODB_URI` format is correct
3. Test locally: `npm run dev` in backend folder

### Issue: CORS error in browser console
**Cause**: Backend doesn't allow Vercel frontend
**Fix**:
1. Update `CLIENT_URLS` in backend `.env`:
   ```
   CLIENT_URLS=https://your-vercel-app.vercel.app
   ```
2. Re-deploy Render service

### Issue: Authentication fails
**Cause**: OAuth credentials wrong or callback URLs mismatch
**Fix**:
1. Verify OAuth callback URLs match exactly:
   - Google: `https://mentoring-backend.onrender.com/api/auth/google/callback`
   - Facebook: `https://mentoring-backend.onrender.com/api/auth/facebook/callback`
2. Check credentials in Render env vars
3. Re-deploy

---

## 📊 STEP 7: Monitor Usage

### MongoDB Atlas Storage (512MB Free Tier)
```
1. Go to mongodb.com/cloud/atlas
2. Cluster → Metrics → Storage
3. Watch for when you exceed 512MB
```

### Vercel Bandwidth (100GB Free Tier)
```
1. Go to vercel.com/dashboard
2. Project → Analytics → Bandwidth
3. View monthly usage
```

### Render Uptime & Logs
```
1. Go to render.com/dashboard
2. Select your service
3. View logs, uptime, performance
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Deployment
- [ ] All `.env` files filled with correct values
- [ ] MongoDB Atlas cluster created and IP allowlisted
- [ ] All third-party API keys generated (Google, Pusher, Cloudinary)
- [ ] GitHub repository is public or Vercel/Render have access
- [ ] Backend `package.json` has `"start"` script
- [ ] Frontend `vite.config.ts` is production-ready

### Deployment Steps
- [ ] Step 1: Deploy backend to Render
  - Render URL: `https://mentoring-backend.onrender.com`
- [ ] Step 2: Deploy frontend to Vercel
  - Vercel URL: `https://your-app-name.vercel.app`
- [ ] Step 3: Test health endpoints
- [ ] Step 4: Test authentication
- [ ] Step 5: Test database operations

### Post-Deployment
- [ ] Monitor MongoDB storage usage
- [ ] Monitor Vercel bandwidth
- [ ] Check Render logs for errors
- [ ] Set up monitoring alerts (optional)

---

## 💡 Next Steps

### If Everything Works ✅
- Share your live URL: `https://your-app-name.vercel.app`
- Invite users to test
- Collect feedback

### If Something Breaks ❌
1. Check error in browser console (F12)
2. Check Render logs: `render.com/dashboard`
3. Check MongoDB Atlas status page
4. Verify all env variables are set correctly
5. Try re-deploying the affected service

### For Production Upgrades
- **Need more MongoDB storage?** Upgrade to M2: $57/mo (2GB)
- **Need faster backend?** Upgrade Render to Starter: $7/mo (1GB RAM)
- **Need more bandwidth?** Upgrade Vercel Pro: $20/mo
- **Need custom domain?** Vercel free + custom domain

---

## 📞 Support & Resources

| Issue | Resource |
|-------|----------|
| MongoDB Atlas | https://docs.mongodb.com/atlas/ |
| Render Deployment | https://render.com/docs |
| Vercel Deployment | https://vercel.com/docs |
| Node.js Express | https://expressjs.com/ |
| React + Vite | https://vitejs.dev/ |

---

**Happy Deploying! 🎉**

Questions? Check the browser console (F12) for detailed error messages.
