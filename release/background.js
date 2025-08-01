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
      // Try to connect to Discord's RPC endpoint
      const response = await fetch('https://discord.com/api/v9/users/@me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.log('Discord web API not accessible:', error);
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
        body: JSON.stringify(presenceData)
      });

      if (response.ok) {
        console.log('Presence updated via Discord API');
      } else {
        console.log('Failed to update presence via API:', response.status);
      }
    } catch (error) {
      console.error('Error updating presence via API:', error);
    }
  }

  async clearPresence() {
    if (!this.isConnected) {
      return false;
    }

    try {
      console.log('Clearing Discord Presence');
      
      // Clear local storage
      chrome.storage.local.remove(['lastDiscordPresence', 'lastUpdate']);
      
      // Try to clear Discord presence via content script
      await this.sendToDiscordTab(null);
      
      // Also try to clear via Discord API if we have a token
      if (this.token) {
        await this.clearPresenceViaAPI();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear Discord presence:', error);
      return false;
    }
  }

  async clearPresenceViaAPI() {
    try {
      const response = await fetch('https://discord.com/api/v9/users/@me/activities', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Presence cleared via Discord API');
      } else {
        console.log('Failed to clear presence via API:', response.status);
      }
    } catch (error) {
      console.error('Error clearing presence via API:', error);
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

  async sendToDiscordTab(presenceData) {
    try {
      // Find Discord tabs
      const tabs = await chrome.tabs.query({
        url: 'https://discord.com/*'
      });

      if (tabs.length > 0) {
        // Send presence data to Discord tabs
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_DISCORD_PRESENCE',
              presenceData: presenceData
            });
          } catch (error) {
            console.log('Could not send to Discord tab:', error);
          }
        }
      } else {
        console.log('No Discord tabs found');
      }
    } catch (error) {
      console.error('Error sending to Discord tabs:', error);
    }
  }

  // Helper method to create presence data from song info
  createSongPresence(songInfo, language = 'en') {
    const translations = this.getTranslations(language);
    
    return {
      details: `${translations.listeningTo} ${songInfo.title}`,
      state: `${translations.onSoundCloud} ${songInfo.artist}`,
      largeImageKey: 'soundcloud',
      largeImageText: 'SoundCloud',
      smallImageKey: 'play',
      smallImageText: 'Playing',
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
      state: `${translations.onSoundCloud} ${songInfo.artist}`,
      largeImageKey: 'soundcloud',
      largeImageText: 'SoundCloud',
      smallImageKey: 'play',
      smallImageText: 'Playing',
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

  // Method to check if Discord is running
  async checkDiscordStatus() {
    // In a real implementation, you would check if Discord is running
    // For now, we'll assume it's always available
    return true;
  }

  // Method to get Discord user info
  async getUserInfo() {
    // In a real implementation, you would get the current Discord user info
    return {
      id: 'user_id',
      username: 'username',
      discriminator: '0000'
    };
  }
}

class DiscordPresenceManager {
  constructor() {
    this.currentSong = null;
    this.settings = {
      language: 'en',
      enablePresence: true,
      showButton: true,
      autoToggle: true
    };
    this.presenceInterval = null;
    this.discordRPC = null;
    this.token = null;
    this.userInfo = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupMessageListeners();
    this.startPresenceMonitoring();
  }

  async loadSettings() {
    const stored = await chrome.storage.sync.get({
      language: 'en',
      enablePresence: true,
      showButton: true,
      autoToggle: true,
      discordToken: null,
      discordUser: null
    });
    this.settings = stored;
    this.token = stored.discordToken;
    this.userInfo = stored.discordUser;
    console.log('Loaded settings:', this.settings);
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'SONG_DETECTED':
          this.handleSongDetected(message.songInfo, message.isActive);
          break;
        case 'SETTINGS_UPDATED':
          this.handleSettingsUpdated(message.settings);
          break;
        case 'GET_STATUS':
          this.handleGetStatus(sendResponse);
          return true; // Keep message channel open for async response
        case 'TEST_PRESENCE':
          this.handleTestPresence(message.settings);
          break;
        case 'TOGGLE_PRESENCE':
          this.handleTogglePresence(message.enablePresence);
          break;
        case 'INIT_DISCORD_RPC':
          this.handleInitDiscordRPC(message, sendResponse);
          return true; // Keep message channel open for async response
        case 'CLEAR_DISCORD_RPC':
          this.handleClearDiscordRPC(sendResponse);
          return true; // Keep message channel open for async response
        case 'DISCORD_OAUTH_REQUEST':
          this.handleDiscordOAuth(message, sendResponse);
          return true; // Keep message channel open for async response
        case 'OAUTH_CODE_RECEIVED':
          this.handleOAuthCodeReceived(message, sendResponse);
          return true; // Keep message channel open for async response
      }
    });
  }

  async handleInitDiscordRPC(message, sendResponse) {
    try {
      console.log('Initializing Discord RPC with token and user info');
      
      const { token, userInfo } = message;
      
      if (token && userInfo) {
        const success = await this.discordRPC.initialize(token, userInfo);
        
        if (success) {
          console.log('Discord RPC initialized successfully');
          sendResponse({ success: true, message: 'Discord RPC initialized' });
        } else {
          console.log('Discord RPC initialization failed');
          sendResponse({ success: false, message: 'Discord RPC initialization failed' });
        }
      } else {
        console.log('No token or user info provided for Discord RPC');
        sendResponse({ success: false, message: 'No authentication data provided' });
      }
    } catch (error) {
      console.error('Error initializing Discord RPC:', error);
      sendResponse({ success: false, message: 'Error initializing Discord RPC' });
    }
  }

  async handleDiscordOAuth(message, sendResponse) {
    try {
      console.log('Handling Discord OAuth request');
      
      const clientId = '1400634915942301806';
      const clientSecret = 'pCshhHlz7qbSLhz2yR6DbrQxSE3GW9ir'; // You'll need to add this
      const redirectUri = 'https://soundcords-o7s7vh90a-fentzzz.vercel.app/oauth-callback.html';
      
      // Start OAuth flow
      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
      
      // Open OAuth page
      const authTab = await chrome.tabs.create({ url: authUrl, active: true });
      
      // Store tab info for later cleanup
      this.oauthTabId = authTab.id;
      
      sendResponse({ success: true, message: 'OAuth flow started' });
    } catch (error) {
      console.error('Failed to start Discord OAuth:', error);
      sendResponse({ success: false, message: 'Failed to start OAuth' });
    }
  }

  async handleOAuthCodeReceived(message, sendResponse) {
    try {
      console.log('OAuth code received:', message.code);
      
      // Use Vercel API for secure token exchange
      const vercelApiUrl = 'https://soundcords-o7s7vh90a-fentzzz.vercel.app/api/discord-oauth';
      
      const response = await fetch(vercelApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: message.code,
          redirectUri: 'https://soundcords-b3nz7pd8d-fentzzz.vercel.app/oauth-callback.html'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Vercel API error:', response.status, errorData);
        throw new Error('Failed to exchange code for token');
      }
      
      const result = await response.json();
      console.log('OAuth result from Vercel:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'OAuth failed');
      }
      
      // Save user info and token
      await chrome.storage.sync.set({
        isConnected: true,
        discordToken: result.accessToken,
        discordUser: result.userInfo,
        refreshToken: result.refreshToken,
        tokenExpiresAt: Date.now() + (result.expiresIn * 1000)
      });
      
      // Close OAuth tab
      if (this.oauthTabId) {
        try {
          await chrome.tabs.remove(this.oauthTabId);
        } catch (error) {
          console.warn('Could not close OAuth tab:', error);
        }
      }
      
      sendResponse({ success: true, userInfo: result.userInfo });
    } catch (error) {
      console.error('Failed to handle OAuth code:', error);
      sendResponse({ success: false, message: 'Failed to complete OAuth' });
    }
  }

  async handleClearDiscordRPC(sendResponse) {
    try {
      console.log('Clearing Discord RPC...');
      
      // Clear Discord RPC connection
      if (this.discordRPC) {
        await this.discordRPC.clearPresence();
        this.discordRPC = null;
      }
      
      // Clear stored data
      this.token = null;
      this.userInfo = null;
      
      console.log('Discord RPC cleared successfully');
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to clear Discord RPC:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleSongDetected(songInfo, isActive) {
    console.log('Song detected:', songInfo, 'isActive:', isActive);
    this.currentSong = songInfo;
    
    // Always update presence when song is detected (auto toggle is the default behavior)
    if (isActive) {
      console.log('Song is playing, updating Discord presence');
      this.updateDiscordPresence(songInfo);
    } else {
      console.log('Song stopped, clearing Discord presence');
      this.clearDiscordPresence();
    }

    // Notify popup if open
    this.notifyPopup();
  }

  handleSettingsUpdated(settings) {
    this.settings = settings;
    
    // If auto toggle is enabled, don't manually control presence
    if (this.settings.autoToggle) {
      // Let the song detection handle presence automatically
      return;
    }
    
    // Manual mode: use the enablePresence setting
    if (this.currentSong && settings.enablePresence) {
      this.updateDiscordPresence(this.currentSong);
    } else {
      this.clearDiscordPresence();
    }
  }

  handleGetStatus(sendResponse) {
    sendResponse({
      active: !!this.currentSong,
      songInfo: this.currentSong
    });
  }

  async handleTestPresence(testSettings) {
    const testSong = {
      title: 'Test Song',
      artist: 'Test Artist',
      url: 'https://soundcloud.com/test'
    };

    const tempSettings = { ...this.settings, ...testSettings };
    this.updateDiscordPresence(testSong, tempSettings);

    // Clear test presence after 5 seconds
    setTimeout(() => {
      this.clearDiscordPresence();
    }, 5000);
  }

  handleTogglePresence(enablePresence) {
    console.log('Toggling presence:', enablePresence ? 'ON' : 'OFF');
    
    // Update the settings
    this.settings.enablePresence = enablePresence;
    
    // If auto toggle is enabled, don't manually control presence
    if (this.settings.autoToggle) {
      console.log('Auto toggle is enabled, letting song detection handle presence');
      return;
    }
    
    // Manual mode: immediately update presence based on current song
    if (this.currentSong && enablePresence) {
      console.log('Enabling presence for current song');
      this.updateDiscordPresence(this.currentSong);
    } else {
      console.log('Disabling presence');
      this.clearDiscordPresence();
    }
  }

  updateDiscordPresence(songInfo, customSettings = null) {
    const settings = customSettings || this.settings;
    const translations = this.getTranslations(settings.language);

    console.log('Updating Discord presence for song:', songInfo.title);

    const presenceData = {
      type: 'rich',
      name: 'SoundCloud',
      details: `${translations.listeningTo} ${songInfo.title}`,
      state: `${translations.onSoundCloud} ${songInfo.artist}`,
      largeImageKey: 'soundcloud',
      largeImageText: 'SoundCloud',
      smallImageKey: 'play',
      smallImageText: 'Playing',
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

  async clearDiscordPresence() {
    try {
      if (this.discordRPC) {
        await this.discordRPC.clearPresence();
      }
    } catch (error) {
      console.error('Failed to clear Discord presence:', error);
    }

    // Also clear local storage
    chrome.storage.local.remove(['currentPresence', 'lastUpdate']);
  }

  async sendPresenceToDiscord(presenceData) {
    try {
      // Initialize Discord Rich Presence if not already done
      if (!this.discordRPC) {
        this.discordRPC = new DiscordRichPresence();
        await this.discordRPC.initialize(this.token, this.userInfo);
      }

      // Update Discord presence
      await this.discordRPC.updatePresence(presenceData);
      
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

  startPresenceMonitoring() {
    // Check for active SoundCloud tabs periodically
    this.presenceInterval = setInterval(async () => {
      const tabs = await chrome.tabs.query({
        url: 'https://soundcloud.com/*',
        active: true
      });

      if (tabs.length === 0) {
        // No active SoundCloud tabs, clear presence
        if (this.currentSong) {
          this.currentSong = null;
          this.clearDiscordPresence();
          this.notifyPopup();
        }
      }
    }, 10000); // Check every 10 seconds
  }

  notifyPopup() {
    chrome.runtime.sendMessage({
      type: 'SONG_UPDATED',
      songInfo: this.currentSong
    }).catch(() => {
      // Popup might not be open, ignore error
    });
  }

  cleanup() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }
    this.clearDiscordPresence();
  }
}

// Initialize the presence manager
const presenceManager = new DiscordPresenceManager();

// Note: OAuth callback listener removed since we're using simplified connection

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(() => {
  presenceManager.cleanup();
}); 