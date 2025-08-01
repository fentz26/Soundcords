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
      // Use the proper Discord Rich Presence API endpoint
      const response = await fetch('https://discord.com/api/v9/users/@me/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: presenceData.details,
          type: 2, // Listening activity type
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
        console.log('Rich Presence cleared via Discord API');
      } else {
        const errorText = await response.text();
        console.log('Failed to clear presence via API:', response.status, errorText);
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
        case 'RESTORE_LAST_STATE':
          this.handleRestoreLastState(message, sendResponse);
          return true; // Keep message channel open for async response
        case 'SHOW_DEFAULT_INTERFACE':
          this.handleShowDefaultInterface(sendResponse);
          return true; // Keep message channel open for async response
        case 'SAVE_CURRENT_STATE':
          this.handleSaveCurrentState(message, sendResponse);
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
      const redirectUri = 'https://soundcords-7133vgmmz-fentzzz.vercel.app/oauth-callback.html';
      
      // Start OAuth flow with proper scopes for Rich Presence
      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
      
      // Create a popup window instead of a new tab
      const popup = await chrome.windows.create({
        url: authUrl,
        type: 'popup',
        width: 500,
        height: 600,
        left: Math.round((screen.width - 500) / 2),
        top: Math.round((screen.height - 600) / 2)
      });
      
      // Store window info for later cleanup
      this.oauthWindowId = popup.id;
      
      sendResponse({ success: true, message: 'OAuth flow started in popup window' });
    } catch (error) {
      console.error('Failed to start Discord OAuth:', error);
      sendResponse({ success: false, message: 'Failed to start OAuth' });
    }
  }

  async handleOAuthCodeReceived(message, sendResponse) {
    try {
      console.log('OAuth code received:', message.code);
      
      // Use Vercel API for secure token exchange
      const vercelApiUrl = 'https://soundcords.vercel.app/api/discord-oauth';
      
      const response = await fetch(vercelApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: message.code,
          redirectUri: 'https://soundcords.vercel.app/oauth-callback.html'
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
      if (this.oauthWindowId) {
        try {
          await chrome.windows.remove(this.oauthWindowId);
        } catch (error) {
          console.warn('Could not close OAuth window:', error);
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

  async handleRestoreLastState(message, sendResponse) {
    try {
      console.log('Restoring last state:', message.pageState, message.activeTab);
      
      // Send message to popup to restore state
      chrome.runtime.sendMessage({
        type: 'RESTORE_LAST_STATE',
        pageState: message.pageState,
        activeTab: message.activeTab
      });
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to restore last state:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleShowDefaultInterface(sendResponse) {
    try {
      console.log('Showing default interface');
      
      // Send message to popup to show default interface
      chrome.runtime.sendMessage({
        type: 'SHOW_DEFAULT_INTERFACE'
      });
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to show default interface:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleSaveCurrentState(message, sendResponse) {
    try {
      console.log('Saving current state:', message.pageState, message.activeTab);
      
      // Save state to storage
      await chrome.storage.local.set({
        lastPageState: message.pageState,
        lastActiveTab: message.activeTab,
        lastSaveTime: Date.now()
      });
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to save current state:', error);
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

// Listen for OAuth success messages from the callback page
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'DISCORD_OAUTH_SUCCESS') {
    console.log('OAuth success received from callback page:', message);
    
    try {
      // Handle the OAuth success
      const { data } = message;
      
      // Save user info and token
      await chrome.storage.sync.set({
        isConnected: true,
        discordToken: data.accessToken,
        discordUser: data.userInfo,
        refreshToken: data.refreshToken,
        tokenExpiresAt: Date.now() + (data.expiresIn * 1000)
      });
      
      // Initialize Discord RPC with the new token
      await presenceManager.handleInitDiscordRPC({
        token: data.accessToken,
        userInfo: data.userInfo
      }, (response) => {
        console.log('Discord RPC initialization response:', response);
        if (response && response.success) {
          console.log('Discord RPC initialized successfully');
        } else {
          console.log('Discord RPC initialization failed');
        }
      });
      
      // Close the OAuth tab if it exists
      if (presenceManager.oauthWindowId) {
        try {
          await chrome.windows.remove(presenceManager.oauthWindowId);
        } catch (error) {
          console.warn('Could not close OAuth window:', error);
        }
      }
      
      // Notify the popup that connection was successful
      chrome.runtime.sendMessage({
        type: 'DISCORD_CONNECTION_SUCCESS',
        userInfo: data.userInfo
      }).catch(() => {
        // Popup might not be open, ignore error
      });
      
      // Send response back to the callback page
      sendResponse({ success: true });
      
    } catch (error) {
      console.error('Failed to handle OAuth success:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep the message channel open for async response
  }
});

// Listen for window updates to detect OAuth completion
chrome.windows.onRemoved.addListener(async (windowId) => {
  // Check if this is our OAuth window being closed
  if (presenceManager.oauthWindowId && windowId === presenceManager.oauthWindowId) {
    console.log('OAuth window was closed');
    presenceManager.oauthWindowId = null;
  }
});

// Listen for tab updates to detect OAuth completion
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if this is our OAuth callback page
  if (presenceManager.oauthWindowId && changeInfo.status === 'complete') {
    const url = new URL(tab.url);
    
    // Check if we have a code parameter (successful OAuth)
    if (url.searchParams.has('code')) {
      const code = url.searchParams.get('code');
      console.log('OAuth code detected in callback page:', code);
      
      try {
        // Process the OAuth code
        const vercelApiUrl = 'https://soundcords-7133vgmmz-fentzzz.vercel.app/api/discord-oauth';
        
        const response = await fetch(vercelApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirectUri: 'https://soundcords-7133vgmmz-fentzzz.vercel.app/oauth-callback.html'
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
        
        // Initialize Discord RPC with the new token
        await presenceManager.handleInitDiscordRPC({
          token: result.accessToken,
          userInfo: result.userInfo
        }, (response) => {
          console.log('Discord RPC initialization response:', response);
          if (response && response.success) {
            console.log('Discord RPC initialized successfully');
          } else {
            console.log('Discord RPC initialization failed');
          }
        });
        
        // Close the OAuth window
        try {
          await chrome.windows.remove(presenceManager.oauthWindowId);
          presenceManager.oauthWindowId = null;
        } catch (error) {
          console.warn('Could not close OAuth window:', error);
        }
        
        // Notify the popup that connection was successful
        chrome.runtime.sendMessage({
          type: 'DISCORD_CONNECTION_SUCCESS',
          userInfo: result.userInfo
        }).catch(() => {
          // Popup might not be open, ignore error
        });
        
        console.log('OAuth flow completed successfully');
        
      } catch (error) {
        console.error('Failed to process OAuth code:', error);
        
        // Close the OAuth window even on error
        try {
          await chrome.windows.remove(presenceManager.oauthWindowId);
          presenceManager.oauthWindowId = null;
        } catch (closeError) {
          console.warn('Could not close OAuth window:', closeError);
        }
      }
    }
  }
});

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(() => {
  presenceManager.cleanup();
}); 