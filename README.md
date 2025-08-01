# Soundcord

A Chrome extension that connects your SoundCloud activity to Discord presence.

## 🚀 Setup Instructions

### 1. GitHub Repository

```bash
# Clone or create the repository
git init
git add .
git commit -m "Initial commit: Soundcord Discord extension"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/soundcord.git
git push -u origin main
```

### 2. Vercel Deployment

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Import your repository

2. **Set Environment Variables:**
   - In Vercel dashboard, go to your project settings
   - Add environment variable:
     - **Name:** `DISCORD_CLIENT_SECRET`
     - **Value:** Your Discord application client secret

3. **Update Extension Code:**
   - Replace `https://your-vercel-app.vercel.app` in `extension/background.js` with your actual Vercel URL
   - Deploy the updated code

### 3. Discord Application Setup

1. **Create Discord Application:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application
   - Note your **Client ID** and **Client Secret**

2. **Configure OAuth2:**
   - Go to OAuth2 settings
   - Add redirect URI: `https://your-vercel-app.vercel.app/api/discord-oauth`
   - Copy Client Secret to Vercel environment variables

### 4. Extension Installation

1. **Load Extension:**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder

2. **Test Connection:**
   - Click the extension icon
   - Click "Connect Discord Account"
   - Complete OAuth flow
   - Verify Discord username appears

## 📁 Project Structure

```
soundcord/
├── extension/           # Chrome extension files
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   ├── content.js
│   ├── discord-content.js
│   └── popup.css
├── api/                 # Vercel API routes
│   └── discord-oauth.js
├── package.json
├── vercel.json
└── README.md
```

## 🔧 Configuration

### Environment Variables (Vercel)
- `DISCORD_CLIENT_SECRET`: Your Discord application client secret

### Discord Application Settings
- **Client ID:** `1400634915942301806`
- **Redirect URI:** `https://your-vercel-app.vercel.app/api/discord-oauth`
- **Scopes:** `identify`

## 🔒 Security

- ✅ Client secret stored securely on Vercel
- ✅ OAuth flow handled server-side
- ✅ No sensitive data in extension code
- ✅ CORS properly configured

## 🚀 Deployment

```bash
# Deploy to Vercel
vercel --prod

# Or use Vercel dashboard
# 1. Connect GitHub repository
# 2. Set environment variables
# 3. Deploy automatically
```

## 📝 Notes

- The extension will show real Discord usernames after OAuth
- Reconnection works without re-authentication
- All Discord data is stored locally in Chrome storage
- Vercel API handles secure token exchange

## 🐛 Troubleshooting

1. **OAuth not working:**
   - Check Vercel environment variables
   - Verify Discord redirect URI
   - Check browser console for errors

2. **Extension not loading:**
   - Ensure all files are in `extension/` folder
   - Check manifest.json syntax
   - Reload extension in Chrome

3. **API errors:**
   - Check Vercel function logs
   - Verify Discord client secret
   - Test API endpoint directly 