# Soundcords Chrome Extension - Release Version

This folder contains the Chrome extension files ready for distribution to users.

## Installation Instructions:

### For Users:

1. **Download the extension files:**
   - Download all files from this folder
   - Keep them in a single folder

2. **Install in Chrome:**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing these extension files

3. **Connect Discord Account:**
   - Click the Soundcords extension icon
   - Click "Connect Discord Account"
   - Complete the OAuth flow
   - Your Discord username should appear

### For Developers:

This is the production-ready version of the extension with:
- Updated manifest.json pointing to the live Vercel API
- All necessary permissions and host permissions
- Optimized for distribution

## Files Included:

### Core Extension Files:
- `manifest.json` - Extension configuration
- `background.js` - Service worker for Discord presence
- `content.js` - SoundCloud page monitoring
- `discord-content.js` - Discord page integration
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `popup.css` - Popup styling

### Assets:
- `logo_soundcord.png` - Extension icon
- `icons/` - Various icon sizes
- `font/` - Custom fonts

### Documentation:
- `install.md` - Installation instructions

## API Endpoint:
The extension connects to: `https://soundcords-6tz3jy0eo-fentzzz.vercel.app/api/discord-oauth`

## Features:
- ✅ Real-time SoundCloud activity monitoring
- ✅ Discord Rich Presence integration
- ✅ Secure OAuth flow
- ✅ Automatic Discord presence updates 