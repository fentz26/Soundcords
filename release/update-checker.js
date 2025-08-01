// Update Checker Component
// Handles checking for updates and managing loading states

class UpdateChecker {
  constructor() {
    this.lastCheckTime = null;
    this.checkInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
    this.loadingAnimation = null;
  }

  // Initialize update checker
  async initialize() {
    await this.loadLastCheckTime();
    
    // Check if update check is needed
    const needsUpdateCheck = this.shouldCheckForUpdates();
    
    if (needsUpdateCheck) {
      await this.performUpdateCheck();
    } else {
      // Skip loading animation and restore last state
      await this.restoreLastState();
    }
  }

  // Load last check time from storage
  async loadLastCheckTime() {
    const result = await chrome.storage.local.get(['lastUpdateCheck']);
    this.lastCheckTime = result.lastUpdateCheck || 0;
  }

  // Check if update check is needed
  shouldCheckForUpdates() {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    
    return timeSinceLastCheck >= this.checkInterval;
  }

  // Perform update check with loading animation
  async performUpdateCheck() {
    console.log('Performing update check...');
    
    // Initialize loading animation
    this.loadingAnimation = new LoadingAnimation();
    
    // Show loading animation
    await this.loadingAnimation.show();
    
    // Perform actual update check
    await this.checkForUpdates();
    
    // Update last check time
    await this.updateLastCheckTime();
    
    // Restore last state or show main interface
    await this.restoreLastState();
  }

  // Check for actual updates
  async checkForUpdates() {
    try {
      // Simulate update check (replace with actual update logic)
      await this.delay(2000); // Simulate network request
      
      // Check for extension updates
      const hasUpdates = await this.checkExtensionUpdates();
      
      // Check for configuration updates
      const hasConfigUpdates = await this.checkConfigUpdates();
      
      console.log('Update check completed:', { hasUpdates, hasConfigUpdates });
      
      return { hasUpdates, hasConfigUpdates };
    } catch (error) {
      console.error('Update check failed:', error);
      return { hasUpdates: false, hasConfigUpdates: false };
    }
  }

  // Check for extension updates
  async checkExtensionUpdates() {
    try {
      // This would typically check against a version API
      // For now, we'll simulate no updates
      await this.delay(500);
      return false;
    } catch (error) {
      console.error('Extension update check failed:', error);
      return false;
    }
  }

  // Check for configuration updates
  async checkConfigUpdates() {
    try {
      // This would check for any configuration changes
      // For now, we'll simulate no updates
      await this.delay(500);
      return false;
    } catch (error) {
      console.error('Config update check failed:', error);
      return false;
    }
  }

  // Update last check time
  async updateLastCheckTime() {
    this.lastCheckTime = Date.now();
    await chrome.storage.local.set({ lastUpdateCheck: this.lastCheckTime });
  }

  // Restore last state or show main interface
  async restoreLastState() {
    try {
      // Get last saved state
      const result = await chrome.storage.local.get(['lastPageState', 'lastActiveTab']);
      
      if (result.lastPageState && result.lastActiveTab) {
        // Restore to last page
        await this.restoreToLastPage(result.lastPageState, result.lastActiveTab);
      } else {
        // Show default interface
        await this.showDefaultInterface();
      }
    } catch (error) {
      console.error('Failed to restore last state:', error);
      await this.showDefaultInterface();
    }
  }

  // Restore to last page
  async restoreToLastPage(pageState, activeTab) {
    console.log('Restoring to last page:', pageState);
    
    // Send message to background script to restore state
    chrome.runtime.sendMessage({
      type: 'RESTORE_LAST_STATE',
      pageState: pageState,
      activeTab: activeTab
    });
  }

  // Show default interface
  async showDefaultInterface() {
    console.log('Showing default interface');
    
    // Send message to background script to show default interface
    chrome.runtime.sendMessage({
      type: 'SHOW_DEFAULT_INTERFACE'
    });
  }

  // Save current state
  async saveCurrentState(pageState, activeTab) {
    await chrome.storage.local.set({
      lastPageState: pageState,
      lastActiveTab: activeTab,
      lastSaveTime: Date.now()
    });
  }

  // Force update check (for manual updates)
  async forceUpdateCheck() {
    console.log('Forcing update check...');
    this.lastCheckTime = 0; // Reset last check time
    await this.performUpdateCheck();
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UpdateChecker;
} 