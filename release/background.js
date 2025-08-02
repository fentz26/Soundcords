// Discord Rich Presence Integration
// This module handles the actual Discord Rich Presence API communication

// Discord RPC class for handling Discord presence
class DiscordRPC {
  constructor() {
    this.clientId = '1400634915942301806'; // Updated Discord Application ID
    this.userId = '463894270810783755'; // Your Discord User ID
    this.isConnected = false;
    this.connection = null;
    this.token = null;
    this.userInfo = null;
  }

  async initialize(token = null, userInfo = null) {
    try {
      console.log('Initializing Discord Rich Presence...');
      
      // Only set connected if we have valid token and user info
      if (token && userInfo) {
        this.token = token;
        this.userInfo = userInfo;
        console.log('Using provided Discord token and user info');
        
        // Check if Discord is running by trying to connect to Discord's RPC
        const isDiscordRunning = await this.checkDiscordRunning();
        
        if (!isDiscordRunning) {
          console.log('Discord is not running, will use web-based presence');
        }
        
        this.isConnected = true;
        console.log('Discord Rich Presence initialized successfully');
        return true;
      } else {
        console.log('No valid token provided, authentication required');
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize Discord Rich Presence:', error);
      this.isConnected = false;
      return false;
    }
  }

  async checkDiscordRunning() {
    try {
      // This would check if Discord is running
      return false;
    } catch (error) {
      console.error('Error checking Discord status:', error);
      return false;
    }
  }

  async updatePresence(presenceData) {
    if (!this.isConnected) {
      console.warn('Discord Rich Presence not connected');
      return false;
    }

    try {
      const formattedData = this.formatPresenceData(presenceData);
      console.log('Discord Presence Update:', formattedData);
      
      // Store the presence data for debugging
      chrome.storage.local.set({
        lastDiscordPresence: formattedData,
        lastUpdate: Date.now()
      });
      
      // Try to send to Discord via a content script in a Discord tab
      await this.sendToDiscordTab(formattedData);
      
      // Also try to update via Discord API if we have a token
      if (this.token) {
        await this.updatePresenceViaAPI(formattedData);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update Discord presence:', error);
      return false;
    }
  }

  async updatePresenceViaAPI(presenceData) {
    try {
      const response = await fetch('https://discord.com/api/v9/users/@me/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "SoundCloud",
          type: 2,
          state: presenceData.state,
          details: presenceData.details,
          timestamps: presenceData.startTimestamp ? {
            start: presenceData.startTimestamp
          } : undefined,
          assets: {
            large_image: presenceData.largeImageKey,
            large_text: presenceData.largeImageText,
            small_image: presenceData.smallImageKey,
            small_text: presenceData.smallImageText
          },
          buttons: presenceData.buttons || []
        })
      });

      if (response.ok) {
        console.log('Rich Presence updated via Discord API');
        const result = await response.json();
        console.log('Presence update result:', result);
      } else {
        const errorText = await response.text();
        console.log('Failed to update presence via API:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error updating presence via API:', error);
    }
  }

  async sendToDiscordTab(presenceData) {
    try {
      // Send message to Discord tab if available
      const tabs = await chrome.tabs.query({ url: '*://discord.com/*' });
      if (tabs.length > 0) {
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'updatePresence',
              data: presenceData
            });
          } catch (error) {
            console.log('Failed to send to Discord tab:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending to Discord tab:', error);
    }
  }

  formatPresenceData(data) {
    return {
      details: data.details,
      state: data.state,
      largeImageKey: data.largeImageKey,
      largeImageText: data.largeImageText,
      smallImageKey: data.smallImageKey,
      smallImageText: data.smallImageText,
      startTimestamp: data.startTimestamp,
      buttons: data.buttons || []
    };
  }

  async clearPresence() {
    if (!this.isConnected) {
      return;
    }

    try {
      // Clear presence via API
      if (this.token) {
        await fetch('https://discord.com/api/v9/users/@me/activities', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
      
      // Clear from storage
      chrome.storage.local.remove(['lastDiscordPresence', 'currentPresence']);
      console.log('Discord presence cleared');
    } catch (error) {
      console.error('Failed to clear Discord presence:', error);
    }
  }
}

class DiscordRichPresence {
  constructor() {
    this.clientId = '1400634915942301806'; // Updated Discord Application ID
    this.userId = '463894270810783755'; // Your Discord User ID
    this.isConnected = false;
    this.presenceData = null;
    this.discordRPC = null;
    this.token = null;
    this.userInfo = null;
  }

  async initialize(token = null, userInfo = null) {
    try {
      // Only initialize if we have valid token and user info
      if (token && userInfo) {
        // Load Discord Rich Presence SDK
        await this.loadDiscordSDK(token, userInfo);
        this.isConnected = true;
        console.log('Discord Rich Presence initialized');
      } else {
        console.log('No valid token provided, authentication required');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Failed to initialize Discord Rich Presence:', error);
      this.isConnected = false;
    }
  }

  async loadDiscordSDK(token = null, userInfo = null) {
    // Load the Discord RPC module
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Create Discord RPC instance
          this.discordRPC = new DiscordRPC();
          this.discordRPC.initialize(token, userInfo).then(() => {
            console.log('Discord RPC loaded successfully');
            resolve();
          }).catch((error) => {
            console.error('Failed to load Discord RPC:', error);
            resolve();
          });
        } catch (error) {
          console.error('Error creating Discord RPC instance:', error);
          resolve();
        }
      }, 100);
    });
  }

  async updatePresence(presenceData) {
    if (!this.isConnected || !this.discordRPC) {
      console.warn('Discord Rich Presence not connected');
      return;
    }

    try {
      const formattedData = this.formatPresenceData(presenceData);
      
      await this.discordRPC.updatePresence(formattedData);
      this.presenceData = formattedData;
      console.log('Presence updated successfully');
    } catch (error) {
      console.error('Failed to update Discord presence:', error);
    }
  }

  async clearPresence() {
    if (!this.isConnected || !this.discordRPC) {
      return;
    }

    try {
      await this.discordRPC.clearPresence();
      this.presenceData = null;
      console.log('Presence cleared successfully');
    } catch (error) {
      console.error('Failed to clear Discord presence:', error);
    }
  }

  formatPresenceData(data) {
    return {
      details: data.details,
      state: data.state,
      largeImageKey: data.largeImageKey,
      largeImageText: data.largeImageText,
      smallImageKey: data.smallImageKey,
      smallImageText: data.smallImageText,
      startTimestamp: data.startTimestamp,
      buttons: data.buttons || []
    };
  }

  // Helper method to create presence data from song info
  createSongPresence(songInfo, language = 'en') {
    const translations = this.getTranslations(language);
    
    return {
      details: `${translations.listeningTo} ${songInfo.title}`,
      state: `${translations.onSoundCloud}`,
      largeImageKey: 'soundcloud',
      largeImageText: 'SoundCloud',
      smallImageKey: 'play',
      smallImageText: 'Listening',
      startTimestamp: Date.now(),
      buttons: [
        {
          label: translations.viewOnSoundCloud,
          url: songInfo.url
        }
      ]
    };
  }

  getTranslations(language) {
    const translations = {
      en: {
        listeningTo: 'Listening to',
        onSoundCloud: 'on SoundCloud',
        viewOnSoundCloud: 'View on SoundCloud'
      },
      ja: {
        listeningTo: '聴いている',
        onSoundCloud: 'SoundCloudで',
        viewOnSoundCloud: 'SoundCloudで見る'
      }
    };

    return translations[language] || translations.en;
  }
}

class DiscordPresenceManager {
  constructor() {
    this.currentSong = null;
    this.settings = {
      language: 'en',
      showButton: true,
      enablePresence: true,
      autoToggle: false
    };
    this.token = null;
    this.userInfo = null;
    this.discordRPC = null;
  }

  async initialize() {
    console.log('=== Background Script: Initializing Discord Presence Manager ===');
    
    // Load settings from storage
    await this.loadSettings();
    
    // Initialize Discord RPC
    this.discordRPC = new DiscordRPC();
    await this.discordRPC.initialize(this.token, this.userInfo);
    
    console.log('Discord Presence Manager initialized');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['settings', 'token', 'userInfo']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
      if (result.token) {
        this.token = result.token;
      }
      if (result.userInfo) {
        this.userInfo = result.userInfo;
      }
      console.log('Loaded settings:', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({
        settings: this.settings,
        token: this.token,
        userInfo: this.userInfo
      });
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  updateDiscordPresence(songInfo, customSettings = null) {
    console.log('=== Background Script: Updating Discord Presence ===');
    console.log('Song info:', songInfo);
    
    const settings = customSettings || this.settings;
    const translations = this.getTranslations(settings.language);

    console.log('Updating Discord presence for song:', songInfo.title);

    const presenceData = {
      details: songInfo.title, // Just the song title
      state: songInfo.artist,  // Just the artist
      largeImageKey: 'soundcloud',
      largeImageText: 'SoundCloud',
      smallImageKey: 'play',
      smallImageText: 'Listening',
      startTimestamp: Date.now()
    };

    if (settings.showButton) {
      presenceData.buttons = [
        {
          label: translations.viewOnSoundCloud,
          url: songInfo.url
        }
      ];
    }

    console.log('Presence data:', presenceData);
    // Send presence to Discord
    this.sendPresenceToDiscord(presenceData);
  }

  async sendPresenceToDiscord(presenceData) {
    console.log('=== Background Script: Sending Presence to Discord ===');
    console.log('Presence data:', presenceData);
    
    try {
      // Try to use desktop companion first (better Rich Presence)
      console.log('Attempting to send to desktop companion...');
      const companionResponse = await fetch('http://localhost:3000/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          songInfo: {
            title: presenceData.details, // Song Title
            artist: presenceData.state,  // Artist
            url: presenceData.buttons?.[0]?.url || this.currentSong?.url || 'https://soundcloud.com'
          },
          isActive: true
        })
      });

      if (companionResponse.ok) {
        console.log('✅ Rich Presence updated via desktop companion');
        
        // Store presence data for reference
        chrome.storage.local.set({
          currentPresence: presenceData,
          lastUpdate: Date.now()
        });
        
        return;
      }

      // Fallback to Discord web API if companion is not available
      console.log('Desktop companion not available, using Discord web API');
      const response = await fetch('https://discord.com/api/v9/users/@me/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "SoundCloud", // Application name
          type: 2, // Listening activity type for music
          state: presenceData.state, // Artist
          details: presenceData.details, // Song Title
          timestamps: presenceData.startTimestamp ? {
            start: presenceData.startTimestamp
          } : undefined,
          assets: {
            large_image: presenceData.largeImageKey,
            large_text: presenceData.largeImageText,
            small_image: presenceData.smallImageKey,
            small_text: presenceData.smallImageText
          },
          buttons: presenceData.buttons || []
        })
      });

      if (response.ok) {
        console.log('Rich Presence updated via Discord API (fallback)');
        const result = await response.json();
        console.log('Presence update result:', result);
      } else {
        const errorText = await response.text();
        console.log('Failed to update presence via API:', response.status, errorText);
      }
      
      // Store presence data for reference
      chrome.storage.local.set({
        currentPresence: presenceData,
        lastUpdate: Date.now()
      });
      
      console.log('Discord Presence Update:', presenceData);
    } catch (error) {
      console.error('Failed to update Discord presence:', error);
      
      // Fallback: store presence data locally and log for debugging
      chrome.storage.local.set({
        currentPresence: presenceData,
        lastUpdate: Date.now()
      });
      
      console.log('Presence data stored locally as fallback:', presenceData);
    }
  }

  getTranslations(language) {
    const translations = {
      en: {
        listeningTo: 'Listening to',
        onSoundCloud: 'on SoundCloud',
        viewOnSoundCloud: 'View on SoundCloud'
      },
      ja: {
        listeningTo: '聴いている',
        onSoundCloud: 'SoundCloudで',
        viewOnSoundCloud: 'SoundCloudで見る'
      }
    };

    return translations[language] || translations.en;
  }

  // Additional methods for the DiscordPresenceManager class
  async updateSongInfo(songInfo) {
    this.currentSong = songInfo;
    
    if (songInfo && this.settings.enablePresence) {
      this.updateDiscordPresence(this.currentSong);
    }
    
    // Update popup with new song info
    chrome.runtime.sendMessage({
      action: 'updatePopup',
      data: {
        active: !!this.currentSong,
        songInfo: this.currentSong
      }
    });
  }

  async updateSettings(settings) {
    this.settings = settings;
    await this.saveSettings();
    
    if (this.settings.autoToggle) {
      // Handle auto toggle logic
    }
  }

  async testPresence(testSettings = {}) {
    const testSong = {
      title: 'Test Song',
      artist: 'Test Artist',
      url: 'https://soundcloud.com/test'
    };
    
    const tempSettings = { ...this.settings, ...testSettings };
    this.updateDiscordPresence(testSong, tempSettings);
  }

  async togglePresence(enablePresence) {
    console.log('togglePresence called with enablePresence:', enablePresence);
    
    this.settings.enablePresence = enablePresence;
    await this.saveSettings();
    
    console.log('Settings updated, enablePresence:', this.settings.enablePresence);
    
    if (this.settings.autoToggle) {
      // Handle auto toggle logic
    }
    
    if (this.currentSong && enablePresence) {
      console.log('Updating Discord presence with current song');
      this.updateDiscordPresence(this.currentSong);
    } else {
      console.log('No current song or presence disabled');
    }
  }
}

// Initialize the Discord Presence Manager
const discordPresenceManager = new DiscordPresenceManager();
discordPresenceManager.initialize();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  switch (message.action) {
    case 'updateSong':
      discordPresenceManager.updateSongInfo(message.songInfo);
      sendResponse({ success: true });
      break;
      
    case 'updateSettings':
      discordPresenceManager.updateSettings(message.settings);
      sendResponse({ success: true });
      break;
      
    case 'testPresence':
      discordPresenceManager.testPresence(message.testSettings);
      sendResponse({ success: true });
      break;
      
    case 'togglePresence':
      console.log('Background script received togglePresence message:', message);
      discordPresenceManager.togglePresence(message.enablePresence);
      sendResponse({ success: true });
      break;
      
    case 'getCurrentSong':
      sendResponse({ songInfo: discordPresenceManager.currentSong });
      break;
      
    case 'getSettings':
      sendResponse({ settings: discordPresenceManager.settings });
      break;
      
    default:
      console.log('Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep the message channel open for async response
});