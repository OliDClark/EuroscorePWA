# EuroscorePWA
A Progressive Web App for party voting with Parse backend integration

## Features

🎉 **Party Management**
- Create new parties with custom names and descriptions
- Join existing parties using party codes
- View all parties you've participated in

👍 **Interactive Voting**
- Vote using thumbs up, thumbs middle, or thumbs down
- Real-time vote updates saved to Parse backend
- Change your vote anytime

🏆 **Live Scoreboard**
- View aggregated party scores
- See rankings with medal indicators (🥇🥈🥉)
- Track individual vote breakdowns

📱 **Progressive Web App**
- Install on mobile and desktop devices
- Offline support via service worker
- Native app-like experience

## Setup Instructions

### 1. Parse Server Configuration

You need a Parse server to use this app. You can:
- Use [Back4App](https://www.back4app.com/) (free tier available)
- Host your own Parse server
- Use [Parse Platform](https://parseplatform.org/)

### 2. Configure Parse Settings

Edit `app.js` and update the Parse configuration with your server details:

```javascript
const PARSE_CONFIG = {
    appId: 'YOUR_APP_ID',           // Your Parse application ID
    javascriptKey: 'YOUR_JAVASCRIPT_KEY',  // Your JavaScript key
    serverURL: 'YOUR_SERVER_URL'    // e.g., 'https://parseapi.back4app.com'
};
```

### 3. Parse Server Schema

The app creates the following Parse classes automatically:

- **User** (built-in Parse class)
  - username
  - email
  - password

- **Party**
  - name (String)
  - description (String)
  - code (String) - unique 6-character code
  - password (String) - party password required to join
  - creator (Pointer to User)

Note: older parties may store the party code in the password field (legacy format).

- **PartyMember**
  - user (Pointer to User)
  - party (Pointer to Party)

- **Vote**
  - user (Pointer to User)
  - party (Pointer to Party)
  - vote (String: "up", "middle", or "down")

### 4. Deploy

Deploy the app to any static hosting service:

**GitHub Pages:**
```bash
# Enable GitHub Pages in repository settings
```

**Netlify:**
```bash
# Connect your repository to Netlify
```

**Vercel:**
```bash
# Connect your repository to Vercel
```

**Local Testing:**
```bash
# Use a local HTTP server
python3 -m http.server 8000
# or
npx serve
```

Then open `http://localhost:8000` in your browser.

## Usage

### Creating an Account
1. Click "Create Account"
2. Enter username, email, and password
3. Click "Sign Up"

### Creating a Party
1. Navigate to "Create Party" tab
2. Enter party name, party code, and party password
3. Click "Create Party"
4. Share both the party code and party password with friends

### Joining a Party
1. Navigate to "Join Party" tab
2. Enter the party code and party password
3. Click "Join Party"

### Voting
1. Select a party from "My Parties"
2. Click on one of the voting buttons:
   - 👍 Thumbs Up (+1 point)
   - 👊 Thumbs Middle (0 points)
   - 👎 Thumbs Down (-1 point)
3. Your vote is saved automatically

### Viewing Scoreboard
- The scoreboard updates automatically after voting
- Click "Refresh Scores" to update manually
- Top 3 users get medal indicators

## Technology Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Parse Server
- **PWA:** Service Worker, Web Manifest
- **Icons:** PNG icons for app installation

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with PWA support

## License

MIT License - feel free to use and modify
