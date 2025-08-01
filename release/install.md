# Installation Guide

## Quick Setup

### Step 1: Download the Extension
1. Download all the files from this repository
2. Extract them to a folder on your computer

### Step 2: Load in Chrome
1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the folder containing the extension files

### Step 3: Configure Discord
1. Create a Discord application at https://discord.com/developers/applications
2. Note your Application ID
3. Update the `clientId` in `discord-presence.js` with your Application ID

### Step 4: Test the Extension
1. Go to SoundCloud.com
2. Play any track
3. Check your Discord status - it should show the current song

## Troubleshooting

### Extension Not Loading
- Make sure all files are in the same folder
- Check that `manifest.json` is in the root folder
- Verify Chrome is up to date

### Discord Not Updating
- Ensure Discord is running
- Check that you're logged into Discord
- Verify the Application ID is correct
- Try the "Test Presence" button in the extension popup

### Song Not Detected
- Make sure you're on a SoundCloud page
- Verify the song is actually playing
- Try refreshing the page
- Check the browser console for errors

## Files Checklist

Make sure you have all these files:
- [ ] manifest.json
- [ ] popup.html
- [ ] popup.css
- [ ] popup.js
- [ ] content.js
- [ ] background.js
- [ ] discord-presence.js
- [ ] icons/icon16.png
- [ ] icons/icon48.png
- [ ] icons/icon128.png
- [ ] README.md

## Next Steps

1. Replace the placeholder icon files with actual PNG icons
2. Update the Discord Application ID in `discord-presence.js`
3. Test the extension thoroughly
4. Consider publishing to the Chrome Web Store

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all files are present and in the correct locations
3. Try reloading the extension
4. Contact the development team for assistance 