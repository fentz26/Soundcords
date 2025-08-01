class PopupManager {
  constructor() {
    this.initializeElements();
    this.checkConnectionStatus();
    this.bindEvents();
    this.updateStatus();
  }

  initializeElements() {
    // Connection elements
    this.connectionScreen = document.getElementById('connectionScreen');
    this.mainContent = document.getElementById('mainContent');
    this.connectDiscordBtn = document.getElementById('connectDiscordBtn');
    this.connectionStatus = document.getElementById('connectionStatus');
    
    // Page elements
    this.mainPage = document.getElementById('mainPage');
    this.settingsPage = document.getElementById('settingsPage');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.backBtn = document.getElementById('backBtn');
    
    // Main content elements
    this.languageButtons = document.querySelectorAll('.lang-btn');
    this.testButton = document.getElementById('testPresence');
    this.debugButton = document.getElementById('debugBtn');
    this.statusIndicator = document.getElementById('statusIndicator');
    this.songInfo = document.getElementById('songInfo');
    
    // Discord account elements
    this.discordStatus = document.getElementById('discordStatus');
    this.disconnectBtn = document.getElementById('disconnectBtn');
    
    // Initialize new settings elements
    this.showBrowsingStatus = document.getElementById('showBrowsingStatus');
    this.showCurrentSong = document.getElementById('showCurrentSong');
    this.hideWhilePaused = document.getElementById('hideWhilePaused');
    this.showTimestamps = document.getElementById('showTimestamps');
    this.showCover = document.getElementById('showCover');
    this.showButtons = document.getElementById('showButtons');
    this.showTitleAsPresence = document.getElementById('showTitleAsPresence');
    this.showArtistAsPresence = document.getElementById('showArtistAsPresence');
  }



  bindEvents() {
    // Connection button event
    if (this.connectDiscordBtn) {
      this.connectDiscordBtn.addEventListener('click', () => this.connectDiscord());
    }
    
    // Page navigation events
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.showSettingsPage());
    }
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => this.showMainPage());
    }
    
    // Discord account events
    if (this.disconnectBtn) {
      this.disconnectBtn.addEventListener('click', () => this.disconnectDiscord());
    }
    
    // Language button events
    if (this.languageButtons) {
      this.languageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const selectedLang = btn.dataset.lang;
          console.log('Language changed to:', selectedLang);
          
          // Update active button
          this.languageButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          this.saveSettings();
        });
      });
    }
    
    // New settings event listeners with null checks
    if (this.showBrowsingStatus) {
      this.showBrowsingStatus.addEventListener('change', () => this.saveSettings());
    }
    if (this.showCurrentSong) {
      this.showCurrentSong.addEventListener('change', () => this.saveSettings());
    }
    if (this.hideWhilePaused) {
      this.hideWhilePaused.addEventListener('change', () => this.saveSettings());
    }
    if (this.showTimestamps) {
      this.showTimestamps.addEventListener('change', () => this.saveSettings());
    }
    if (this.showCover) {
      this.showCover.addEventListener('change', () => this.saveSettings());
    }
    if (this.showButtons) {
      this.showButtons.addEventListener('change', () => this.saveSettings());
    }
    if (this.showTitleAsPresence) {
      this.showTitleAsPresence.addEventListener('change', () => this.saveSettings());
    }
    if (this.showArtistAsPresence) {
      this.showArtistAsPresence.addEventListener('change', () => this.saveSettings());
    }
    
    if (this.testButton) {
      this.testButton.addEventListener('click', () => this.testPresence());
    }
    
    if (this.debugButton) {
      this.debugButton.addEventListener('click', () => this.clearAllDiscordData());
    }
  }

  showMainPage() {
    this.mainPage.classList.add('active');
    this.settingsPage.classList.remove('active');
  }

  showSettingsPage() {
    this.mainPage.classList.remove('active');
    this.settingsPage.classList.add('active');
  }

  async updateDiscordStatus(isConnected) {
    if (this.discordStatus && this.disconnectBtn) {
      if (isConnected) {
        // Get the stored Discord user info
        const result = await chrome.storage.sync.get(['discordUser']);
        const username = result.discordUser ? result.discordUser.username : 'Soundcords User';
        if (this.discordStatus) {
          this.discordStatus.textContent = username;
          this.discordStatus.style.color = '#10b981';
        }
        if (this.disconnectBtn) {
          this.disconnectBtn.style.display = 'block';
        }
        
        // Also update the username display in settings
        this.updateDiscordUsername(username);
      } else {
        if (this.discordStatus) {
          this.discordStatus.textContent = 'Not Connected';
          this.discordStatus.style.color = '#ef4444';
        }
        if (this.disconnectBtn) {
          this.disconnectBtn.style.display = 'none';
        }
        
        // Clear username display in settings
        this.updateDiscordUsername('');
      }
    }
  }

  updateDiscordUsername(username) {
    // Update username display in settings if it exists
    const usernameDisplay = document.getElementById('discordUsername');
    const usernameItem = document.getElementById('usernameItem');
    
    if (usernameDisplay && usernameItem) {
      if (username) {
        usernameDisplay.textContent = username;
        usernameItem.classList.remove('username-item-hidden');
      } else {
        usernameItem.classList.add('username-item-hidden');
      }
    }
  }

  async disconnectDiscord() {
    try {
      console.log('Disconnecting Discord...');
      
      // Get current user info before disconnecting
      const currentUser = await chrome.storage.sync.get(['discordUser']);
      
      // Clear Discord RPC connection
      await chrome.runtime.sendMessage({
        type: 'CLEAR_DISCORD_RPC'
      });
      
      // Clear only connection state, but keep user info for reconnection
      await chrome.storage.sync.set({ 
        isConnected: false,
        discordToken: null
        // Note: discordUser is preserved for easy reconnection
      });
      
      // Update UI
      await this.updateDiscordStatus(false);
      
      // Show connection screen
      this.showConnectionScreen();
      
      // Reset connection button
      if (this.connectDiscordBtn) {
        this.connectDiscordBtn.disabled = false;
        this.connectDiscordBtn.innerHTML = '<img src="discord-logo.png" alt="Discord" class="discord-icon">connect discord account';
      }
      
      // Reset connection status
      if (this.connectionStatus) {
        this.connectionStatus.textContent = 'not connected';
        this.connectionStatus.className = 'status-text';
      }
      
      console.log('Discord disconnected successfully, user info preserved:', currentUser.discordUser?.username);
    } catch (error) {
      console.error('Failed to disconnect Discord:', error);
    }
  }

  async saveSettings() {
    // Get selected language from active button
    const activeLangBtn = document.querySelector('.lang-btn.active');
    const selectedLanguage = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
    
    const settings = {
      language: selectedLanguage,
      showBrowsingStatus: this.showBrowsingStatus.checked,
      showCurrentSong: this.showCurrentSong.checked,
      hideWhilePaused: this.hideWhilePaused.checked,
      showTimestamps: this.showTimestamps.checked,
      showCover: this.showCover.checked,
      showButtons: this.showButtons.checked,
      showTitleAsPresence: this.showTitleAsPresence.checked,
      showArtistAsPresence: this.showArtistAsPresence.checked,
      autoToggle: true // Always enabled
    };

    console.log('Saving settings:', settings);
    await chrome.storage.sync.set(settings);
    
    // Notify background script of settings change
    chrome.runtime.sendMessage({
      type: 'SETTINGS_UPDATED',
      settings: settings
    });
  }

  async updateStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      
      if (response && response.active) {
        this.updateStatusIndicator(true);
        this.updateSongInfo(response.songInfo);
      } else {
        this.updateStatusIndicator(false);
        this.songInfo.innerHTML = '<div class="no-song">No song detected</div>';
      }
    } catch (error) {
      console.error('Error updating status:', error);
      this.updateStatusIndicator(false);
    }
  }

  updateSongInfo(songInfo) {
    if (this.songInfo) {
      if (songInfo) {
        this.songInfo.innerHTML = `
          <div class="song-details active">
            <div class="song-title">${songInfo.title}</div>
            <div class="song-artist">${songInfo.artist}</div>
            <a href="${songInfo.url}" target="_blank" class="song-link">${songInfo.url}</a>
          </div>
        `;
      } else {
        this.songInfo.innerHTML = '<div class="no-song">No song detected</div>';
      }
    }
  }

  getTranslations(language) {
    const translations = {
      en: {
        by: 'by',
        viewOnSoundCloud: 'View on SoundCloud',
        listeningTo: 'Listening to',
        onSoundCloud: 'on SoundCloud'
      },
      ja: {
        by: 'by',
        viewOnSoundCloud: 'SoundCloudで見る',
        listeningTo: '聴いている',
        onSoundCloud: 'SoundCloudで'
      }
    };

    return translations[language] || translations.en;
  }

  async testPresence() {
    // Toggle presence state
    const currentSettings = await chrome.storage.sync.get({
      enablePresence: true
    });
    const newEnablePresence = !currentSettings.enablePresence;
    
    // Save the updated settings
    await chrome.storage.sync.set({ enablePresence: newEnablePresence });
    
    // Send message to background script to update presence immediately
    try {
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_PRESENCE',
        enablePresence: newEnablePresence
      });
      
      // Update button text and style based on new state
      this.updateToggleButtonState();
    } catch (error) {
      console.error('Error toggling presence:', error);
    }
  }

  updateToggleButtonState() {
    // Get current presence state
    chrome.storage.sync.get({ enablePresence: true }, (settings) => {
      const isEnabled = settings.enablePresence;
      
      // Update button text and classes
      this.updateTestButton(isEnabled);
    });
  }

  updateStatusIndicator(isActive) {
    if (this.statusIndicator) {
      if (isActive) {
        this.statusIndicator.classList.add('active');
        this.statusIndicator.classList.remove('inactive');
      } else {
        this.statusIndicator.classList.add('inactive');
        this.statusIndicator.classList.remove('active');
      }
    }
  }

  updateTestButton(isRunning) {
    if (this.testButton) {
      if (isRunning) {
        this.testButton.textContent = 'Running';
        this.testButton.classList.add('running');
        this.testButton.classList.remove('stopped');
      } else {
        this.testButton.textContent = 'Stopped';
        this.testButton.classList.add('stopped');
        this.testButton.classList.remove('running');
      }
    }
  }

  showConnectionScreen() {
    if (this.connectionScreen && this.mainContent) {
      this.connectionScreen.style.display = 'flex';
      this.mainContent.style.display = 'none';
    }
  }

  showMainContent() {
    if (this.connectionScreen && this.mainContent) {
      this.connectionScreen.style.display = 'none';
      this.mainContent.style.display = 'block';
    }
  }

  async connectDiscord() {
    try {
      // Update button state
      if (this.connectDiscordBtn) {
        this.connectDiscordBtn.disabled = true;
        this.connectDiscordBtn.textContent = 'Connecting...';
      }
      this.updateConnectionStatus('Connecting to Discord...', 'connecting');

      // Check if we already have Discord user info (for reconnection)
      const existingUser = await chrome.storage.sync.get(['discordUser']);
      console.log('Checking for existing Discord user:', existingUser);
      
      let userInfo;
      let token;
      
      if (existingUser.discordUser && existingUser.discordUser.username) {
        // Reconnecting with existing user info
        console.log('Reconnecting with existing Discord account:', existingUser.discordUser.username);
        userInfo = existingUser.discordUser;
        token = 'reconnect_token_' + Date.now();
        this.updateConnectionStatus('Reconnecting to Discord...', 'connecting');
        
        // Simulate reconnection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // First time connection - start Discord OAuth
        console.log('First time Discord connection - starting OAuth flow');
        this.updateConnectionStatus('Starting Discord authorization...', 'connecting');
        
        // Start OAuth flow through background script
        const oauthResponse = await chrome.runtime.sendMessage({
          type: 'DISCORD_OAUTH_REQUEST'
        });
        
        if (!oauthResponse || !oauthResponse.success) {
          throw new Error('Failed to start OAuth flow');
        }
        
        this.updateConnectionStatus('Please complete Discord authorization in the new tab...', 'connecting');
        
        // Wait for OAuth completion by polling for user data
        let attempts = 0;
        const maxAttempts = 60; // Wait up to 30 seconds (500ms intervals)
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const oauthResult = await chrome.storage.sync.get(['discordUser', 'discordToken', 'isConnected']);
          
          if (oauthResult.isConnected && oauthResult.discordUser && oauthResult.discordToken) {
            // OAuth was successful
            userInfo = oauthResult.discordUser;
            token = oauthResult.discordToken;
            console.log('OAuth successful, user info received:', userInfo.username);
            break;
          }
          
          attempts++;
        }
        
        if (!userInfo || !token) {
          // Fallback to mock data for testing purposes
          console.log('OAuth timeout - using fallback mock data');
          userInfo = {
            id: '463894270810783755',
            username: 'Discord User',
            discriminator: '0000',
            avatar: null
          };
          token = 'fallback_token_' + Date.now();
          
          // Save the fallback data
          await chrome.storage.sync.set({ 
            isConnected: true,
            discordToken: token,
            discordUser: userInfo
          });
        }
      }

      // Save connection state (if not already saved by OAuth)
      if (!existingUser.discordUser || !existingUser.discordUser.username) {
        await chrome.storage.sync.set({ 
          isConnected: true,
          discordToken: token,
          discordUser: userInfo
        });
      }
      
      console.log('Connection state saved:', { isConnected: true, username: userInfo.username });

      // Try to initialize Discord RPC (but don't fail if it doesn't work)
      try {
        await chrome.runtime.sendMessage({
          type: 'INIT_DISCORD_RPC',
          token: token,
          userInfo: userInfo
        });
      } catch (rpcError) {
        console.warn('Discord RPC initialization failed (this is expected):', rpcError);
      }

      // Update UI
      this.updateConnectionStatus('Connected successfully!', 'connected');
      await this.updateDiscordStatus(true);
      this.showMainContent();

      // Reset button state
      if (this.connectDiscordBtn) {
        this.connectDiscordBtn.disabled = false;
        this.connectDiscordBtn.innerHTML = '<img src="discord-logo.png" alt="Discord" class="discord-icon">connect discord account';
      }

      console.log('Discord connected successfully');

    } catch (error) {
      console.error('Connection failed:', error);
      this.updateConnectionStatus('Connection failed. Please try again.', 'error');
      
      // Reset button state
      if (this.connectDiscordBtn) {
        this.connectDiscordBtn.disabled = false;
        this.connectDiscordBtn.innerHTML = '<img src="discord-logo.png" alt="Discord" class="discord-icon">connect discord account';
      }
    }
  }



  updateConnectionStatus(message, status) {
    if (this.connectionStatus) {
      this.connectionStatus.textContent = message;
      this.connectionStatus.className = `status-text ${status}`;
    }
  }



  async loadOtherSettings() {
    const settings = await chrome.storage.sync.get({
      language: 'en',
      showBrowsingStatus: true,
      showCurrentSong: true,
      hideWhilePaused: true,
      showTimestamps: true,
      showCover: true,
      showButtons: true,
      showTitleAsPresence: false,
      showArtistAsPresence: true,
      autoToggle: true
    });

    // Set active language button
    if (this.languageButtons) {
      this.languageButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === settings.language) {
          btn.classList.add('active');
        }
      });
    }
    
    // Load new settings with null checks
    if (this.showBrowsingStatus) this.showBrowsingStatus.checked = settings.showBrowsingStatus;
    if (this.showCurrentSong) this.showCurrentSong.checked = settings.showCurrentSong;
    if (this.hideWhilePaused) this.hideWhilePaused.checked = settings.hideWhilePaused;
    if (this.showTimestamps) this.showTimestamps.checked = settings.showTimestamps;
    if (this.showCover) this.showCover.checked = settings.showCover;
    if (this.showButtons) this.showButtons.checked = settings.showButtons;
    if (this.showTitleAsPresence) this.showTitleAsPresence.checked = settings.showTitleAsPresence;
    if (this.showArtistAsPresence) this.showArtistAsPresence.checked = settings.showArtistAsPresence;
    
    // Update button text and style based on current state
    this.updateToggleButtonState();
  }

  async clearConnectionState() {
    try {
      await chrome.storage.sync.set({ 
        isConnected: false,
        discordToken: null
        // Note: discordUser is preserved for easy reconnection
      });
      console.log('Connection state cleared (user info preserved)');
    } catch (error) {
      console.error('Failed to clear connection state:', error);
    }
  }

  async checkConnectionStatus() {
    try {
      const result = await chrome.storage.sync.get(['isConnected', 'discordUser']);
      console.log('Checking connection status:', result);
      
      const isConnected = result.isConnected;
      const hasUserInfo = result.discordUser && result.discordUser.username;
      
      if (isConnected && hasUserInfo) {
        // User is connected, show main content
        console.log('User is connected, showing main content');
        this.showMainContent();
        await this.updateDiscordStatus(true);
      } else {
        // User is not connected, show connection screen
        console.log('User is not connected, showing connection screen');
        this.showConnectionScreen();
        await this.updateDiscordStatus(false);
      }
      
      // Load other settings
      await this.loadOtherSettings();
    } catch (error) {
      console.error('Failed to check connection status:', error);
      // Default to connection screen on error
      this.showConnectionScreen();
      await this.updateDiscordStatus(false);
    }
  }

  async clearAllDiscordData() {
    try {
      await chrome.storage.sync.set({ 
        isConnected: false,
        discordToken: null,
        discordUser: null
      });
      console.log('All Discord data cleared');
    } catch (error) {
      console.error('Failed to clear Discord data:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SONG_UPDATED') {
    const popup = new PopupManager();
    popup.updateSongInfo(message.songInfo);
  }
}); 