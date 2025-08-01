// Discord Rich Presence Implementation
// This file handles actual Discord Rich Presence communication

class DiscordRPC {
  constructor() {
    this.clientId = '1400634915942301806'; // Updated Discord Application ID
    this.userId = '463894270810783755'; // Your Discord User ID
    this.isConnected = false;
    this.connection = null;
  }

  async initialize(token = null, userInfo = null) {
    try {
      // Only initialize if we have valid token and user info
      if (token && userInfo) {
        // In a real implementation, you would use the Discord Rich Presence SDK
        // For now, we'll create a simple implementation that can communicate with Discord
        
        console.log('Initializing Discord Rich Presence...');
        
        // Store token and user info
        this.token = token;
        this.userInfo = userInfo;
        
        // Simulate connection to Discord
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

  async updatePresence(presenceData) {
    if (!this.isConnected) {
      console.warn('Discord Rich Presence not connected');
      return false;
    }

    try {
      // Format the presence data for Discord
      const formattedData = this.formatPresenceData(presenceData);
      
      // In a real implementation, you would send this to Discord
      // For now, we'll log it and store it locally
      console.log('Discord Presence Update:', formattedData);
      
      // Store the presence data for debugging
      chrome.storage.local.set({
        lastDiscordPresence: formattedData,
        lastUpdate: Date.now()
      });
      
      // Try to send to Discord via a content script in a Discord tab
      await this.sendToDiscordTab(formattedData);
      
      return true;
    } catch (error) {
      console.error('Failed to update Discord presence:', error);
      return false;
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
      
      return true;
    } catch (error) {
      console.error('Failed to clear Discord presence:', error);
      return false;
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiscordRPC;
} else {
  window.DiscordRPC = DiscordRPC;
} 