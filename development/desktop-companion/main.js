const DiscordRPC = require("discord-rpc");
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");

class SoundcordsCompanion {
  constructor() {
    this.clientId = "1400634915942301806";
    this.rpc = null;
    this.isConnected = false;
    this.currentPresence = null;
    
    this.wss = new WebSocket.Server({ port: 8080 });
    
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    
    this.setupWebSocket();
    this.setupHTTPRoutes();
    this.initDiscordRPC();
  }

  async initDiscordRPC() {
    try {
      console.log("Initializing Discord RPC...");
      
      this.rpc = new DiscordRPC.Client({ transport: "ipc" });
      
      this.rpc.on("ready", () => {
        console.log("Discord RPC connected successfully!");
        this.isConnected = true;
      });

      this.rpc.on("disconnected", () => {
        console.log("Discord RPC disconnected");
        this.isConnected = false;
      });

      await this.rpc.login({ clientId: this.clientId });
      
    } catch (error) {
      console.error("Failed to initialize Discord RPC:", error);
      console.log("Make sure Discord desktop app is running!");
    }
  }

  setupWebSocket() {
    this.wss.on("connection", (ws) => {
      console.log("Browser extension connected via WebSocket");
      
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(data, ws);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        console.log("Browser extension disconnected");
      });
    });
  }

  setupHTTPRoutes() {
    this.app.get("/health", (req, res) => {
      res.json({ 
        status: "ok", 
        discordConnected: this.isConnected,
        timestamp: Date.now()
      });
    });

    this.app.post("/presence", async (req, res) => {
      try {
        const { songInfo, isActive } = req.body;
        
        if (isActive && songInfo) {
          await this.updatePresence(songInfo);
          res.json({ success: true, message: "Presence updated" });
        } else {
          await this.clearPresence();
          res.json({ success: true, message: "Presence cleared" });
        }
      } catch (error) {
        console.error("Error updating presence:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post("/clear", async (req, res) => {
      try {
        await this.clearPresence();
        res.json({ success: true, message: "Presence cleared" });
      } catch (error) {
        console.error("Error clearing presence:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.listen(3000, () => {
      console.log("HTTP server running on port 3000");
    });
  }

  handleWebSocketMessage(data, ws) {
    switch (data.type) {
      case "UPDATE_PRESENCE":
        this.updatePresence(data.songInfo);
        ws.send(JSON.stringify({ type: "PRESENCE_UPDATED", success: true }));
        break;
        
      case "CLEAR_PRESENCE":
        this.clearPresence();
        ws.send(JSON.stringify({ type: "PRESENCE_CLEARED", success: true }));
        break;
        
      case "PING":
        ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
        break;
        
      default:
        console.log("Unknown WebSocket message type:", data.type);
    }
  }

  async updatePresence(songInfo) {
    if (!this.isConnected || !this.rpc) {
      console.log("Discord RPC not connected, cannot update presence");
      return;
    }

    try {
      const presenceData = {
        details: `Listening to ${songInfo.title}`,
        state: `on SoundCloud`,
        largeImageKey: "soundcloud",
        largeImageText: "SoundCloud",
        smallImageKey: "play",
        smallImageText: "Playing",
        startTimestamp: Date.now(),
        buttons: [
          {
            label: "View on SoundCloud",
            url: songInfo.url
          }
        ]
      };

      await this.rpc.setActivity(presenceData);
      this.currentPresence = presenceData;
      
      console.log("Rich Presence updated:", presenceData.details);
      
    } catch (error) {
      console.error("Failed to update Discord presence:", error);
    }
  }

  async clearPresence() {
    if (!this.isConnected || !this.rpc) {
      console.log("Discord RPC not connected, cannot clear presence");
      return;
    }

    try {
      await this.rpc.clearActivity();
      this.currentPresence = null;
      console.log("Rich Presence cleared");
      
    } catch (error) {
      console.error("Failed to clear Discord presence:", error);
    }
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

const companion = new SoundcordsCompanion();

process.on("SIGINT", () => {
  console.log("Shutting down Soundcords Companion...");
  if (companion.rpc) {
    companion.rpc.destroy();
  }
  process.exit(0);
});

console.log("Soundcords Desktop Companion starting...");
console.log("Make sure Discord desktop app is running!");
console.log("HTTP API: http://localhost:3000");
console.log("WebSocket: ws://localhost:8080");
