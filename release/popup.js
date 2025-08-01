class PopupManager {
  constructor() {
    this.initializeElements();
    this.startLoadingSequence();
    this.checkConnectionStatus();
    this.bindEvents();
    this.updateStatus();
    this.setupMessageListeners();
  }

  initializeElements() {
    // Loading elements
    this.loadingScreen = document.getElementById('loadingScreen');
    this.loadingStatus = document.getElementById('loadingStatus');
    
    // Animation elements
    this.startLogo = document.getElementById('startLogo');
    this.mainContainer = document.getElementById('mainContainer');
    
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

  startLoadingSequence() {
    // Check if we should show update check (every 10 minutes)
    const lastUpdateCheck = localStorage.getItem('lastUpdateCheck');
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    if (!lastUpdateCheck || (now - parseInt(lastUpdateCheck)) >= tenMinutes) {
      // Show update check with loading animation
      this.performUpdateCheck();
      localStorage.setItem('lastUpdateCheck', now.toString());
    } else {
      // Skip loading and animation, immediately show final state
      this.skipLoadingAnimation();
    }
  }

  async performUpdateCheck() {
    console.log('Performing update check...');
    
    // Update loading status messages
    await this.updateLoadingStatus('Checking for updates...', 2000);
    await this.updateLoadingStatus('Initializing...', 1500);
    await this.updateLoadingStatus('Ready', 1000);
    
    // Hide loading screen and start main animation
    setTimeout(() => {
      this.hideLoadingScreen();
    }, 500);
  }

  async updateLoadingStatus(message, duration) {
    if (this.loadingStatus) {
      this.loadingStatus.textContent = message;
    }
    
    // Wait for the specified duration
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  skipLoadingAnimation() {
    console.log('Skipping loading animation - showing last state');
    
    // Hide loading screen immediately
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'none';
    }
    
    // Show main container without animation
    if (this.mainContainer) {
      this.mainContainer.classList.add('show');
    }
    
    // Position logo at top immediately WITHOUT any center positioning
    if (this.startLogo) {
      // Make sure logo never goes to center
      this.startLogo.style.position = 'absolute';
      this.startLogo.style.top = '20px';
      this.startLogo.style.left = '50%';
      this.startLogo.style.transform = 'translate(-50%, 0)';
      this.startLogo.style.animation = 'none';
      this.startLogo.style.opacity = '1';
      this.startLogo.style.zIndex = '1';
      this.startLogo.style.display = 'block';
      
      // Ensure no center positioning classes or styles
      this.startLogo.classList.remove('center-position');
    }
  }

  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('hide');
      
      // Start main animation after loading screen fades out
      setTimeout(() => {
        this.startAnimation();
      }, 500);
    }
  }

  startAnimation() {
    // Make sure logo starts from center for the animation
    if (this.startLogo) {
      // Reset logo to center position for animation
      this.startLogo.style.position = 'absolute';
      this.startLogo.style.top = '50%';
      this.startLogo.style.left = '50%';
      this.startLogo.style.transform = 'translate(-50%, -50%)';
      this.startLogo.style.opacity = '1';
      this.startLogo.style.zIndex = '1';
      this.startLogo.style.animation = 'none';
    }
    
    // Wait for logo to be positioned, then start the sequence
    setTimeout(() => {
      this.moveLogoToHeader();
    }, 100); // Shorter delay since we're positioning immediately
  }

  moveLogoToHeader() {
    if (this.startLogo) {
      // Add animation class to move logo to header position
      this.startLogo.style.animation = 'logoMoveToHeader 0.8s ease-out forwards';
      
      // After logo moves, show main container
      setTimeout(() => {
        this.showMainContainer();
      }, 800);
    }
  }

  showMainContainer() {
    if (this.mainContainer) {
      // Show main container with fade-in animation
      this.mainContainer.classList.add('show');
      
      // Keep the logo visible - it's now in the header position
      // No need to hide it since it transforms into the final position
    }
  }

  bindEvents() {
    // Connection button event
    if (this.connectDiscordBtn) {
      this.connectDiscordBtn.addEventListener('click', () => this.connectDiscord());
    }
    
    // Page navigation events
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => {
        this.showSettingsPage();
        this.saveCurrentState('settings', 'settings');
      });
    }
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => {
        this.showMainPage();
        this.saveCurrentState('main', 'main');
      });
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

  saveCurrentState(pageState, activeTab) {
    // Save current page state
    chrome.storage.local.set({
      lastPageState: pageState,
      lastActiveTab: activeTab,
      lastSaveTime: Date.now()
    });
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
      // Open the OAuth popup window
      const popup = await chrome.windows.create({
        url: chrome.runtime.getURL('oauth-popup.html'),
        type: 'popup',
        width: 450,
        height: 500,
        left: Math.round((screen.width - 450) / 2),
        top: Math.round((screen.height - 500) / 2)
      });
      
      console.log('OAuth popup opened:', popup.id);
      
    } catch (error) {
      console.error('Failed to open OAuth popup:', error);
      this.updateConnectionStatus('Failed to open connection window. Please try again.', 'error');
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

  async handleDiscordConnectionSuccess(userInfo) {
    try {
      console.log('Handling Discord connection success:', userInfo);
      
      // Update Discord status
      this.updateDiscordStatus(true);
      this.updateDiscordUsername(userInfo.username || 'Connected');
      
      // Show main content
      this.showMainContent();
      
      // Update status indicator
      this.updateStatusIndicator(true);
      
      console.log('Discord connection success handled');
    } catch (error) {
      console.error('Failed to handle Discord connection success:', error);
    }
  }

  setupMessageListeners() {
    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Popup received message:', message);
      
      switch (message.type) {
        case 'SONG_UPDATED':
          this.updateSongInfo(message.songInfo);
          break;
        case 'DISCORD_CONNECTION_SUCCESS':
          this.handleDiscordConnectionSuccess(message.userInfo);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    });
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
  } else if (message.type === 'DISCORD_CONNECTION_SUCCESS') {
    console.log('Discord connection success received in popup:', message);
    const popup = new PopupManager();
    popup.handleDiscordConnectionSuccess(message.userInfo);
  }
}); 