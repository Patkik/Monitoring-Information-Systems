# 📝 FREE-TIER DEPLOYMENT CHECKLIST

## ⏱️ Timeline: ~30-45 minutes

---

## 🔄 PHASE 1: Setup Accounts (5 min)

- [ ] **MongoDB Atlas** → mongodb.com/cloud/atlas → Sign up → Create M0 cluster
- [ ] **Render** → render.com → Sign up with GitHub
- [ ] **Vercel** → vercel.com → Sign up with GitHub

---

## 🗄️ PHASE 2: Database Setup (5 min)

### MongoDB Atlas Configuration

```
✅ Quick Steps:
1. Create M0 Cluster (free forever)
2. Network Access → IP Allowlist → Add 0.0.0.0/0
3. Database Users → Create user (save username/password)
4. Connect → Drivers → Node.js → Copy connection string
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/mentoring_system?retryWrites=true&w=majority
```

**Save as:** `MONGODB_URI` (use in Render backend env vars)

---

## ⚙️ PHASE 3: Backend Deployment (10 min)

### Render Backend Deployment

```
✅ Quick Steps:
1. render.com → New Web Service
2. Select your GitHub repo
3. Name: mentoring-backend | Root: backend | Runtime: Node
4. Build: npm install | Start: npm start
5. Add Environment Variables (see BACKEND ENV VARS below)
6. Deploy → Wait for green checkmark (2-3 min)
```

**Get Your Render Backend URL:**
```
Example: https://mentoring-backend.onrender.com
Save this URL → Use in Step 5 (Frontend)
```

### Backend Environment Variables (Copy & Paste)

**Tier 1: CRITICAL (Must have)**
```
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mentoring_system?retryWrites=true&w=majority
JWT_SECRET=your-32-character-random-secret-key-change-this
SESSION_SECRET=your-different-32-character-random-secret-key-change-this
```

**Tier 2: CORS & URLs**
```
SERVER_URL=https://mentoring-backend.onrender.com
CLIENT_URLS=https://your-frontend-app.vercel.app,http://localhost:5173
```

**Tier 3: OAuth (Get from providers)**
```
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

**Tier 4: Notifications & Files (Get from providers)**
```
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=ap1
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Tier 5: Email**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM_EMAIL=noreply@mentoring-system.com
```

**Tier 6: Optional Features**
```
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
RECAPTCHA_DISABLED=false
FEATURE_FEEDBACK_ENABLED=true
FEATURE_CERTIFICATES_ENABLED=true
```

---

## 🎨 PHASE 4: Frontend Deployment (10 min)

### Vercel Frontend Deployment

```
✅ Quick Steps:
1. vercel.com → Add New Project
2. Select your GitHub repo
3. Framework: Vite | Root: frontend
4. Add Environment Variables (see FRONTEND ENV VARS below)
5. Deploy → Wait for green checkmark (1-2 min)
```

**Get Your Vercel Frontend URL:**
```
Example: https://mentoring-system-demo.vercel.app
Share this URL with users!
```

### Frontend Environment Variables (Copy & Paste)

**Tier 1: CRITICAL (Must have)**
```
VITE_API_URL=https://mentoring-backend.onrender.com/api
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=ap1
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

**Tier 2: Metadata**
```
VITE_APP_NAME=Mentoring System
VITE_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
```

---

## 🔑 PHASE 5: Get API Keys (15 min)

### ✅ Google OAuth
```
URL: console.cloud.google.com
1. Create new project "Mentoring System"
2. APIs & Services → Credentials
3. OAuth 2.0 Client ID → Web Application
4. Authorized redirect URI: https://mentoring-backend.onrender.com/api/auth/google/callback
5. Copy: Client ID, Client Secret
```

### ✅ Pusher (Real-time notifications)
```
URL: pusher.com
1. Sign up free
2. Create app
3. Region: Asia-Pacific (ap1)
4. Copy: App ID, Key, Secret
```

### ✅ Cloudinary (File uploads)
```
URL: cloudinary.com
1. Sign up free
2. Dashboard → Copy: Cloud Name, API Key, API Secret
3. Free tier: 25GB/month storage
```

### ✅ Gmail App Password (SMTP)
```
URL: myaccount.google.com/apppasswords
1. Select Mail + Windows Computer
2. Google generates app password
3. Copy password (NOT your Gmail password)
4. Use for SMTP_PASSWORD
```

### ✅ reCAPTCHA (Form protection)
```
URL: google.com/recaptcha/admin
1. Create new site
2. Choose reCAPTCHA v2 (I'm not a robot)
3. Domains: your-app.vercel.app, localhost:5173
4. Copy: Site Key (frontend), Secret Key (backend)
```

### ✅ Facebook OAuth (optional)
```
URL: developers.facebook.com
1. Create new app
2. Choose Website
3. Get: App ID, App Secret
4. Authorized Redirect URI: https://mentoring-backend.onrender.com/api/auth/facebook/callback
```

---

## 🧪 PHASE 6: Verify Deployment (5 min)

### ✅ Check Frontend Loads
```bash
# Open in browser
https://your-app-name.vercel.app

# Expected: App loads without errors
# Check: Browser console (F12) for red errors
```

### ✅ Check Backend Health
```bash
curl https://mentoring-backend.onrender.com/health
# Expected response: {"status":"ok"}
```

### ✅ Test Authentication
```
1. Open frontend app
2. Click Sign Up
3. Fill form → Submit
4. Should redirect to login
5. Check Render logs for errors
```

### ✅ Verify Database Connection
```
1. Open MongoDB Atlas dashboard
2. Go to Collections
3. Should see new "users" collection with your test user
```

---

## ❌ TROUBLESHOOTING

### Issue: Frontend shows blank page
```
Fix:
1. Check VITE_API_URL in Vercel env vars
2. Should be: https://mentoring-backend.onrender.com/api
3. Re-deploy Vercel
4. Check browser console (F12) for red errors
```

### Issue: Backend deployment fails
```
Fix:
1. Check Render logs for build errors
2. Verify package.json has: "start": "node src/server.js"
3. Check Node version compatibility
4. Try clearing build cache in Render settings
```

### Issue: Cannot connect to MongoDB
```
Fix:
1. Check MONGODB_URI format is correct
2. Verify username/password are correct
3. Check MongoDB IP Allowlist includes 0.0.0.0/0
4. Verify cluster is running (green status at mongodb.com)
```

### Issue: API calls return 401/403
```
Fix:
1. Check backend JWT_SECRET is set
2. Verify SESSION_SECRET is different from JWT_SECRET
3. Re-deploy backend after changing secrets
4. Clear browser cookies
```

### Issue: CORS errors in console
```
Fix:
1. Update CLIENT_URLS in Render backend env vars
2. Add your Vercel URL: https://your-app.vercel.app
3. Re-deploy Render backend
4. Clear browser cache (Ctrl+Shift+Delete)
```

---

## 📊 MONITORING

### MongoDB Storage (512MB free tier)
```
Check at: mongodb.com/cloud/atlas → Your Cluster → Metrics → Storage
Monitor: Don't exceed 512MB or service will be suspended
```

### Vercel Bandwidth (100GB free tier)
```
Check at: vercel.com/dashboard → Project → Analytics → Bandwidth
Monitor: 100GB/month for ~1M page views
```

### Render Logs
```
Check at: render.com/dashboard → Your Service → Logs
Monitor: Memory usage, build errors, runtime exceptions
```

---

## 🎯 QUICK REFERENCE TABLE

| Service | URL | Account | Cost | Limits |
|---------|-----|---------|------|--------|
| **Vercel** | vercel.com | GitHub | FREE | 100GB/mo bandwidth |
| **Render** | render.com | GitHub | FREE | 0.5GB RAM, 750hrs/mo |
| **MongoDB** | mongodb.com/cloud/atlas | Email | FREE | 512MB storage |
| **Pusher** | pusher.com | Email | FREE | 200K messages/day |
| **Cloudinary** | cloudinary.com | Email | FREE | 25GB/month |
| **Gmail** | google.com | Existing | FREE | App passwords only |
| **Google OAuth** | console.cloud.google.com | Email | FREE | Unlimited |
| **Facebook Auth** | developers.facebook.com | Email | FREE | Unlimited |

---

## 📋 FINAL CHECKLIST

### Pre-Deploy
- [ ] All 3 accounts created (MongoDB, Render, Vercel)
- [ ] MongoDB connection string copied
- [ ] All API keys generated
- [ ] Backend `.env` values confirmed
- [ ] Frontend `.env` values confirmed

### Deploy
- [ ] Backend deployed to Render ✅
- [ ] Frontend deployed to Vercel ✅
- [ ] Health endpoint returns 200 ✅
- [ ] App loads without console errors ✅

### Post-Deploy
- [ ] Test Sign Up → new user in MongoDB ✅
- [ ] Test Login → JWT token works ✅
- [ ] Test API calls from frontend ✅
- [ ] Check Render logs for errors ✅

---

## 🎉 SUCCESS!

Your app is now live at:
```
https://your-app-name.vercel.app
```

**Total Cost: $0/month**
**Monthly Uptime: 99.9% (for hobbyist use)**

Share with users and collect feedback! 🚀
