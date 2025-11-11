# FriendBook Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Deploy to Render (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Sign up at [Render.com](https://render.com)**

3. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: friendbook
     - **Runtime**: Node
     - **Build Command**: `cd web && npm install`
     - **Start Command**: `cd web && npm start`
     - **Instance Type**: Free

4. **Add Environment Variables:**
   Go to "Environment" tab and add:
   ```
   TURSO_DATABASE_URL=libsql://friendbook-thewilfulyouth.aws-ap-south-1.turso.io
   TURSO_AUTH_TOKEN=<your_token_from_.env>
   JWT_SECRET=friendbook-jwt-secret-key-2024
   NODE_ENV=production
   ```

5. **Deploy!** Render will automatically build and deploy your app.

---

### Option 2: Deploy to Railway

1. **Push code to GitHub**

2. **Sign up at [Railway.app](https://railway.app)**

3. **Create New Project:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your FriendBook repository
   - Railway will auto-detect it's a Node.js app

4. **Add Environment Variables:**
   In Railway dashboard → Variables tab:
   ```
   TURSO_DATABASE_URL=libsql://friendbook-thewilfulyouth.aws-ap-south-1.turso.io
   TURSO_AUTH_TOKEN=<your_token>
   JWT_SECRET=friendbook-jwt-secret-key-2024
   NODE_ENV=production
   ```

5. **Deploy!** Railway automatically deploys on push.

---

### Option 3: Deploy to Vercel (Serverless)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd web
   vercel
   ```

3. **Add Environment Variables** via Vercel dashboard

---

## 🔐 Security Checklist

Before deploying:

- [ ] Remove `.env` from repository (already in `.gitignore`)
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Update `FRONTEND_URL` in production environment
- [ ] Review and adjust rate limits in `server.js` if needed

---

## 🗄️ Database (Turso)

Your app is already configured to use Turso online database!

**Current Database:**
- URL: `libsql://friendbook-thewilfulyouth.aws-ap-south-1.turso.io`
- Region: AWS ap-south-1 (Mumbai)

**To create a new Turso database:**
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create friendbook

# Get credentials
turso db show friendbook --url
turso db tokens create friendbook
```

---

## 📦 Local Testing Before Deploy

Test production build locally:

```bash
cd web
npm install
NODE_ENV=production npm start
```

Access at: http://localhost:3000

---

## 🌐 Post-Deployment

1. **Get your app URL** from hosting platform dashboard
2. **Update FRONTEND_URL** environment variable to your production URL
3. **Test the admin login:**
   - Username: `admin`
   - Password: `admin123`

---

## 🔧 Common Issues

**Issue: Database connection fails**
- Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set correctly
- App will fallback to local SQLite if Turso fails

**Issue: Build fails**
- Ensure `cd web && npm install` runs successfully locally
- Check Node version (should be 16+)

**Issue: App crashes on startup**
- Check logs in hosting platform dashboard
- Verify all environment variables are set

---

## 📊 Monitoring

- **Render**: Check logs in dashboard → Logs tab
- **Railway**: Check logs in project → Deployments → View logs
- **Vercel**: Check Function logs in dashboard

---

## 💰 Pricing

All three platforms offer **free tiers** suitable for this project:

- **Render Free**: 750 hours/month, sleeps after inactivity
- **Railway Free**: $5 credit/month
- **Vercel Free**: Unlimited for hobby projects

For production with guaranteed uptime, upgrade to paid plans ($7-20/month).

---

## 🎯 Recommended: Render

For FriendBook, I recommend **Render** because:
- ✅ Simple setup with `render.yaml`
- ✅ Great free tier
- ✅ Persistent disk support
- ✅ Good for Node.js apps
- ✅ Easy environment variable management

---

Need help? Check the hosting platform documentation or raise an issue!
