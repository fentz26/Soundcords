# Soundcords Desktop Companion

This desktop companion app provides **native Discord Rich Presence** functionality for the Soundcords browser extension, similar to how PreMiD works.

## Features

- ✅ **Native Discord RPC**: Uses Discord's official RPC SDK
- ✅ **Real-time Communication**: WebSocket connection with browser extension
- ✅ **HTTP API**: REST endpoints for presence updates
- ✅ **Automatic Fallback**: Extension falls back to web API if companion is offline
- ✅ **Rich Presence**: Full Discord Rich Presence with buttons, images, and timestamps

## How It Works

1. **Desktop App**: Runs locally and connects to Discord desktop app via RPC
2. **Browser Extension**: Detects SoundCloud activity and sends data to desktop app
3. **Rich Presence**: Desktop app updates Discord presence using native RPC protocol

## Installation

### Prerequisites

- Node.js 16+ installed
- Discord desktop app running
- Your Discord application configured

### Setup

1. **Install Dependencies**:
   ```bash
   cd desktop-companion
   npm install
   ```

2. **Configure Discord App**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your Soundcords application
   - Copy your Client ID (should be `1400634915942301806`)

3. **Start the Companion**:
   ```bash
   npm start
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
This creates `soundcords-companion.exe` that you can run without Node.js.

### Manual Start
```bash
node main.js
```

## API Endpoints

### HTTP API (Port 3000)

- `GET /health` - Check if companion is running and Discord is connected
- `POST /presence` - Update Discord presence with song info
- `POST /clear` - Clear Discord presence

### WebSocket API (Port 8080)

- `ws://localhost:8080` - Real-time communication
- Messages: `UPDATE_PRESENCE`, `CLEAR_PRESENCE`, `PING`

## Example Usage

### Update Presence
```bash
curl -X POST http://localhost:3000/presence \
  -H "Content-Type: application/json" \
  -d '{
    "songInfo": {
      "title": "Song Title",
      "artist": "Artist Name", 
      "url": "https://soundcloud.com/track"
    },
    "isActive": true
  }'
```

### Clear Presence
```bash
curl -X POST http://localhost:3000/clear
```

### Check Health
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### "Discord RPC not connected"
- Make sure Discord desktop app is running
- Check that your Discord app Client ID is correct
- Restart the companion app

### "Connection refused"
- Check if ports 3000 and 8080 are available
- Make sure no other apps are using these ports
- Try different ports in the code if needed

### "WebSocket connection failed"
- The browser extension will automatically fall back to Discord web API
- Check browser console for connection errors
- Make sure companion app is running

## Architecture

```
Browser Extension (Chrome)
    ↓ (WebSocket/HTTP)
Desktop Companion (Node.js)
    ↓ (RPC)
Discord Desktop App
    ↓
Discord Rich Presence
```

## Benefits Over Web API

1. **Native Rich Presence**: Uses Discord's official RPC protocol
2. **Better Performance**: Direct connection to Discord app
3. **More Features**: Full Rich Presence capabilities
4. **Reliability**: No web API rate limits or restrictions
5. **Real-time**: Instant presence updates

## Security

- Only accepts connections from `localhost`
- No external network access required
- Runs locally on your machine
- No data sent to external servers

## Integration with Extension

The browser extension automatically detects if the desktop companion is available:

1. **Companion Available**: Uses native RPC for best Rich Presence
2. **Companion Offline**: Falls back to Discord web API
3. **Seamless**: No user intervention required

## Development

### Adding New Features

1. Add new endpoints in `main.js`
2. Update WebSocket message handlers
3. Test with browser extension
4. Update documentation

### Debugging

- Check console output for connection status
- Use browser DevTools to monitor WebSocket messages
- Test HTTP endpoints with curl or Postman

## License

MIT License - Same as main project 