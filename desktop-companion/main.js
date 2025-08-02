const DiscordRPC = require('discord-rpc');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const https = require('https');

class SoundcordsCompanion {
  constructor() {
    this.clientId = '1400634915942301806'; // Your Discord Application ID
    this.rpc = null;
    this.isConnected = false;
    this.currentPresence = null;
    
    // WebSocket server for real-time communication with extension
    this.wss = new WebSocket.Server({ port: 8081 });
    
    // HTTP server for REST API communication
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    
    this.setupWebSocket();
    this.setupHTTPRoutes();
    this.initDiscordRPC();
  }

  // Helper function to get Soundcords logo URL
  getSoundcordsLogoUrl() {
    // For now, we'll use a placeholder. In production, this should be uploaded to Discord's CDN
    return 'https://soundcloud.com/favicon.ico'; // Fallback to SoundCloud favicon
  }

  // Helper function to extract artwork URL from SoundCloud
  async extractArtworkUrl(songUrl) {
    try {
      return new Promise((resolve, reject) => {
        const req = https.get(songUrl, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              // Look for artwork URL in the HTML - multiple patterns
              let artworkUrl = null;
              
              // Pattern 1: Look for artwork_url in JSON data
              const artworkMatch1 = data.match(/"artwork_url":"([^"]+)"/);
              if (artworkMatch1 && artworkMatch1[1]) {
                artworkUrl = artworkMatch1[1].replace('t500x500', 't300x300');
                console.log('Found artwork URL (pattern 1):', artworkUrl);
                resolve(artworkUrl);
                return;
              }
              
              // Pattern 2: Look for og:image meta tag
              const ogImageMatch = data.match(/<meta property="og:image" content="([^"]+)"/);
              if (ogImageMatch && ogImageMatch[1]) {
                artworkUrl = ogImageMatch[1];
                console.log('Found artwork URL (og:image):', artworkUrl);
                resolve(artworkUrl);
                return;
              }
              
              // Pattern 3: Look for twitter:image meta tag
              const twitterImageMatch = data.match(/<meta name="twitter:image" content="([^"]+)"/);
              if (twitterImageMatch && twitterImageMatch[1]) {
                artworkUrl = twitterImageMatch[1];
                console.log('Found artwork URL (twitter:image):', artworkUrl);
                resolve(artworkUrl);
                return;
              }
              
              // Pattern 4: Look for any image with "artwork" in the URL
              const artworkUrlMatch = data.match(/https:\/\/[^"]*artwork[^"]*\.(?:jpg|jpeg|png|gif|webp)/i);
              if (artworkUrlMatch) {
                artworkUrl = artworkUrlMatch[0];
                console.log('Found artwork URL (generic):', artworkUrl);
                resolve(artworkUrl);
                return;
              }
              
              console.log('No artwork URL found in page');
              resolve(null);
            } catch (error) {
              console.log('Error parsing artwork URL:', error);
              resolve(null);
            }
          });
        });
        
        req.on('error', (error) => {
          console.log('Error fetching page:', error);
          resolve(null);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          console.log('Request timeout');
          resolve(null);
        });
      });
    } catch (error) {
      console.log('Error in extractArtworkUrl:', error);
      return null;
    }
  }

  async initDiscordRPC() {
    try {
      console.log('Initializing Discord RPC...');
      
      this.rpc = new DiscordRPC.Client({ transport: 'ipc' });
      
      this.rpc.on('ready', () => {
        console.log('Discord RPC connected successfully!');
        this.isConnected = true;
      });

      this.rpc.on('disconnected', () => {
        console.log('Discord RPC disconnected');
        this.isConnected = false;
      });

      await this.rpc.login({ clientId: this.clientId });
      
    } catch (error) {
      console.error('Failed to initialize Discord RPC:', error);
      console.log('Make sure Discord desktop app is running!');
    }
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('Browser extension connected via WebSocket');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(data, ws);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Browser extension disconnected');
      });
    });
  }

  setupHTTPRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        discordConnected: this.isConnected,
        timestamp: Date.now()
      });
    });

    // Update presence endpoint
    this.app.post('/presence', async (req, res) => {
      try {
        const { songInfo, isActive } = req.body;
        
        if (isActive && songInfo) {
          await this.updatePresence(songInfo);
          res.json({ success: true, message: 'Presence updated' });
        } else {
          await this.clearPresence();
          res.json({ success: true, message: 'Presence cleared' });
        }
      } catch (error) {
        console.error('Error updating presence:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Clear presence endpoint
    this.app.post('/clear', async (req, res) => {
      try {
        await this.clearPresence();
        res.json({ success: true, message: 'Presence cleared' });
      } catch (error) {
        console.error('Error clearing presence:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Start HTTP server
    this.app.listen(3000, () => {
      console.log('HTTP server running on port 3000');
    });
  }

  handleWebSocketMessage(data, ws) {
    switch (data.type) {
      case 'UPDATE_PRESENCE':
        this.updatePresence(data.songInfo);
        ws.send(JSON.stringify({ type: 'PRESENCE_UPDATED', success: true }));
        break;
        
      case 'CLEAR_PRESENCE':
        this.clearPresence();
        ws.send(JSON.stringify({ type: 'PRESENCE_CLEARED', success: true }));
        break;
        
      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  async updatePresence(songInfo) {
    if (!this.isConnected || !this.rpc) {
      console.log('Discord RPC not connected, cannot update presence');
      return;
    }

    try {
      let artworkUrl = null;
      let largeImageKey = 'soundcords_logo'; // Default to Soundcords logo
      let largeImageText = 'Soundcords';

      if (songInfo && songInfo.title) {
        // Try to extract artwork URL from the song URL
        try {
          artworkUrl = await this.extractArtworkUrl(songInfo.url);
          console.log('Extracted artwork URL:', artworkUrl);
          if (artworkUrl) {
            // For Discord RPC, we need to use asset keys that are uploaded to Discord
            // For now, we'll use the default SoundCloud asset
            largeImageKey = 'soundcloud';
            largeImageText = songInfo.title;
            console.log('Using SoundCloud asset for artwork');
          } else {
            // Fallback to default SoundCloud artwork
            largeImageKey = 'soundcloud';
            largeImageText = 'SoundCloud';
            console.log('Using fallback SoundCloud artwork');
          }
        } catch (error) {
          console.log('Could not extract artwork URL:', error);
          // Fallback to default SoundCloud artwork
          largeImageKey = 'soundcloud';
          largeImageText = 'SoundCloud';
        }

        console.log('Final largeImageKey:', largeImageKey);
        console.log('Final largeImageText:', largeImageText);

        // Get current time for timestamps
        const startTimestamp = Date.now();
        
        // For now, we'll use a default duration (3 minutes)
        // In a real implementation, you'd get the actual song duration
        const songDurationInSeconds = 3 * 60; // 3 minutes default
        const endTimestamp = startTimestamp + (songDurationInSeconds * 1000);

        const presenceData = {
          // Set the activity type to 'LISTENING' to get the "Listening to" text
          type: 'LISTENING',
          
          // Main line shows the artist name (what appears after "Listening to")
          details: songInfo.artist,
          
          // Second line shows the full song title
          state: `${songInfo.artist} - ${songInfo.title}`,
          
          // Timestamps for progress bar
          startTimestamp: startTimestamp,
          endTimestamp: endTimestamp,
          
          // Large image (album art)
          largeImageKey: largeImageKey,
          largeImageText: largeImageText,
          
          // Small image (optional)
          smallImageKey: 'soundcloud',
          smallImageText: 'SoundCloud',
          
          // Button to link to the song
          buttons: [
            {
              label: 'Listen on SoundCloud',
              url: songInfo.url
            }
          ]
        };

        // Set the Rich Presence activity
        await this.rpc.setActivity(presenceData);
        this.currentPresence = presenceData;

        console.log('Rich Presence updated:', presenceData.details);
      } else {
        // No song playing - show Soundcords logo
        const presenceData = {
          type: 'LISTENING',
          details: 'Soundcords',
          state: 'Ready to listen',
          startTimestamp: Date.now(),
          largeImageKey: this.getSoundcordsLogoUrl(),
          largeImageText: 'Soundcords',
          smallImageKey: 'soundcloud',
          smallImageText: 'SoundCloud'
        };

        await this.rpc.setActivity(presenceData);
        this.currentPresence = presenceData;

        console.log('Rich Presence updated: No song playing');
      }

    } catch (error) {
      console.error('Failed to update Discord presence:', error);
    }
  }

  async clearPresence() {
    if (!this.isConnected || !this.rpc) {
      console.log('Discord RPC not connected, cannot clear presence');
      return;
    }

    try {
      await this.rpc.clearActivity();
      this.currentPresence = null;
      console.log('Rich Presence cleared');
      
    } catch (error) {
      console.error('Failed to clear Discord presence:', error);
    }
  }

  // Broadcast to all connected WebSocket clients
  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Start the companion app
const companion = new SoundcordsCompanion();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Soundcords Companion...');
  if (companion.rpc) {
    companion.rpc.destroy();
  }
  process.exit(0);
});

console.log('Soundcords Desktop Companion starting...');
console.log('Make sure Discord desktop app is running!');
console.log('HTTP API: http://localhost:3000');
console.log('WebSocket: ws://localhost:8081'); 