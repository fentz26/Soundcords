# Soundcords

A Chrome extension that connects your SoundCloud activity to Discord presence.

## 📁 Project Structure

```
Soundcords/
├── development/          # Development and backend files
│   ├── api/             # Vercel API routes
│   ├── package.json     # Node.js dependencies
│   ├── vercel.json      # Vercel configuration
│   ├── .env            # Environment variables
│   └── README.md       # Development guide
├── release/             # Chrome extension for users
│   ├── manifest.json    # Extension configuration
│   ├── *.js            # Extension scripts
│   ├── *.html          # Extension UI
│   ├── *.css           # Extension styling
│   ├── icons/          # Extension icons
│   ├── logo_soundiscord_bot.png    # Main extension logo
│   ├── text_soundcords_white.png   # App title image
│   └── README.md       # Installation guide
└── README.md           # This file
```

## 🚀 Quick Start

### For Users (Install Extension):
1. Go to the `release/` folder
2. Follow the installation instructions in `release/README.md`

### For Developers (Setup Backend):
1. Go to the `development/` folder
2. Follow the setup instructions in `development/README.md`

## 🔧 Development

### Backend (Vercel API):
- **Location:** `development/`
- **API URL:** https://soundcords-6tz3jy0eo-fentzzz.vercel.app
- **Deployment:** Automatic via GitHub integration

### Frontend (Chrome Extension):
- **Location:** `release/`
- **Installation:** Load unpacked in Chrome
- **Distribution:** Ready for users
- **Branding:** Custom logo and text images

## 🔒 Security

- ✅ Client secrets stored securely on Vercel
- ✅ OAuth flow handled server-side
- ✅ No sensitive data in extension code
- ✅ CORS properly configured

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
   - Ensure all files are in the same folder
   - Check manifest.json syntax
   - Reload extension in Chrome

3. **API errors:**
   - Check Vercel function logs
   - Verify Discord client secret
   - Test API endpoint directly 