# Quick Start Guide

Get up and running with Euroscore PWA in 5 minutes!

## Step 1: Get Parse Backend (2 minutes)

### Option A: Back4App (Recommended - Free)
1. Go to https://www.back4app.com/
2. Sign up for free account
3. Click "Build new app"
4. Copy your credentials from App Settings > Security & Keys:
   - Application ID
   - JavaScript Key
   - Server URL: `https://parseapi.back4app.com`

### Option B: Quick Local Setup
```bash
# Using Docker
docker run -d -p 1337:1337 \
  -e APP_ID=myAppId \
  -e MASTER_KEY=myMasterKey \
  parseplatform/parse-server
```

## Step 2: Configure the App (1 minute)

Edit `app.js` line 2-6:

```javascript
const PARSE_CONFIG = {
    appId: 'YOUR_APP_ID',           // Paste your Application ID
    javascriptKey: 'YOUR_JAVASCRIPT_KEY',  // Paste your JavaScript Key
    serverURL: 'https://parseapi.back4app.com'  // Or your server URL
};
```

## Step 3: Deploy (1 minute)

### GitHub Pages
```bash
# Push to GitHub, then enable Pages in Settings
```

### Local Testing
```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve

# Then open http://localhost:8000
```

## Step 4: Use the App (1 minute)

1. **Create Account**: Click "Create Account", enter details
2. **Create Party**: Go to "Create Party" tab, give it a name
3. **Share Code**: Share the 6-character code with friends
4. **Vote**: Click a party, cast your vote 👍👊👎
5. **View Scores**: Check the scoreboard!

## Common Issues

### "Unable to connect to Parse Server"
- ✅ Check your Parse credentials are correct
- ✅ Verify server URL is accessible
- ✅ Check browser console for errors

### Service Worker not registering
- ✅ Use HTTPS (or localhost for testing)
- ✅ Clear browser cache
- ✅ Check browser supports service workers

### Can't join party
- ✅ Verify party code is correct (case-insensitive)
- ✅ Verify party password is correct
- ✅ Check you're logged in
- ✅ Ensure party exists

## Next Steps

- 📖 Read [README.md](README.md) for full features
- 🔧 Read [SETUP.md](SETUP.md) for advanced setup
- ✨ Read [FEATURES.md](FEATURES.md) for technical details

## Need Help?

- Parse docs: https://docs.parseplatform.org/
- Back4App docs: https://www.back4app.com/docs
- Open an issue on GitHub

---

**Enjoy voting with friends! 🎉**
