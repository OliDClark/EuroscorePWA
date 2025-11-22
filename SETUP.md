# Setup Guide for Euroscore PWA

## Quick Start with Back4App (Free)

1. **Create a Back4App Account**
   - Go to [Back4App](https://www.back4app.com/)
   - Sign up for a free account
   - Create a new app

2. **Get Your Credentials**
   - In your Back4App dashboard, go to App Settings > Security & Keys
   - Copy the following:
     - Application ID
     - JavaScript Key
     - Server URL (usually `https://parseapi.back4app.com`)

3. **Configure the App**
   - Open `app.js` in your code editor
   - Find the `PARSE_CONFIG` object at the top:
   ```javascript
   const PARSE_CONFIG = {
       appId: 'YOUR_APP_ID',           // Paste Application ID here
       javascriptKey: 'YOUR_JAVASCRIPT_KEY',  // Paste JavaScript Key here
       serverURL: 'https://parseapi.back4app.com'  // Use Back4App URL
   };
   ```
   - Replace the placeholder values with your actual credentials

4. **Test Locally**
   ```bash
   # Option 1: Python
   python3 -m http.server 8000
   
   # Option 2: Node.js
   npx serve
   ```
   - Open `http://localhost:8000` in your browser

5. **Create Test Account**
   - Click "Create Account"
   - Enter test credentials
   - Create a test party
   - Vote and verify the scoreboard works

## Alternative: Self-Hosted Parse Server

If you want to host your own Parse server:

### Using Docker

```bash
# Pull Parse Server image
docker pull parseplatform/parse-server

# Run Parse Server
docker run -d \
  -p 1337:1337 \
  -e APP_ID=myAppId \
  -e MASTER_KEY=myMasterKey \
  -e DATABASE_URI=mongodb://localhost:27017/parsedb \
  parseplatform/parse-server
```

### Using npm

```bash
# Install Parse Server
npm install -g parse-server

# Run Parse Server
parse-server \
  --appId myAppId \
  --masterKey myMasterKey \
  --databaseURI mongodb://localhost:27017/parsedb \
  --serverURL http://localhost:1337/parse
```

Then update your `app.js`:
```javascript
const PARSE_CONFIG = {
    appId: 'myAppId',
    javascriptKey: 'unused',  // Not needed for self-hosted
    serverURL: 'http://localhost:1337/parse'
};
```

## Parse Dashboard (Optional)

To view and manage your data:

### Back4App
- Use the built-in dashboard at dashboard.back4app.com

### Self-Hosted
```bash
npm install -g parse-dashboard

parse-dashboard \
  --appId myAppId \
  --masterKey myMasterKey \
  --serverURL http://localhost:1337/parse \
  --appName "Euroscore PWA"
```

Open `http://localhost:4040` to access the dashboard.

## Deployment Options

### GitHub Pages
1. Push your code to GitHub
2. Go to Settings > Pages
3. Select your branch and root directory
4. Your app will be available at `https://username.github.io/repository-name/`

### Netlify
1. Create a `netlify.toml` file (optional):
   ```toml
   [build]
     publish = "."
   ```
2. Connect your GitHub repository to Netlify
3. Deploy automatically on push

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Security Considerations

⚠️ **Important:** The Parse keys in `app.js` are visible to users. For production:

1. **Use Parse ACLs (Access Control Lists)**
   - Restrict who can read/write data
   - Set up proper class-level permissions in Parse Dashboard

2. **Enable Parse Server Cloud Code**
   - Move sensitive operations to server-side Cloud Code
   - Validate data on the server

3. **Configure CORS**
   - Limit which domains can access your Parse Server
   - In Back4App: App Settings > Security > Allowed Origins

4. **Use HTTPS**
   - Always use HTTPS in production
   - Back4App provides this by default

## Troubleshooting

### "Unable to connect to Parse Server"
- Check your Parse credentials are correct
- Verify your server URL is accessible
- Check browser console for specific error messages

### "User already exists"
- Username must be unique
- Try a different username

### Votes not saving
- Check Parse Dashboard to verify Vote class exists
- Ensure user is logged in
- Check browser console for errors

### Service Worker not registering
- Service workers require HTTPS (except localhost)
- Check browser compatibility
- Clear browser cache and try again

## Getting Help

- Parse documentation: https://docs.parseplatform.org/
- Back4App documentation: https://www.back4app.com/docs
- Open an issue on GitHub: [repository-url]/issues
