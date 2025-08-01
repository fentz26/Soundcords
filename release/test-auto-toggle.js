// Test script for auto toggle functionality

console.log('Testing Auto Toggle Functionality');

// Test function to simulate song playing
function testSongPlaying() {
  console.log('Simulating song playing...');
  
  const testSong = {
    title: 'Test Song - Playing',
    artist: 'Test Artist',
    url: 'https://soundcloud.com/test',
    timestamp: Date.now()
  };

  chrome.runtime.sendMessage({
    type: 'SONG_DETECTED',
    songInfo: testSong,
    isActive: true
  });
}

// Test function to simulate song stopping
function testSongStopping() {
  console.log('Simulating song stopping...');
  
  chrome.runtime.sendMessage({
    type: 'SONG_DETECTED',
    songInfo: null,
    isActive: false
  });
}

// Test function to toggle auto toggle setting
function toggleAutoToggle() {
  console.log('Toggling auto toggle setting...');
  
  chrome.storage.sync.get(['autoToggle'], (result) => {
    const newValue = !result.autoToggle;
    chrome.storage.sync.set({ autoToggle: newValue }, () => {
      console.log('Auto toggle set to:', newValue);
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: { autoToggle: newValue }
      });
    });
  });
}

// Test function to check current settings
function checkSettings() {
  chrome.storage.sync.get(['autoToggle', 'enablePresence'], (result) => {
    console.log('Current settings:', result);
  });
}

// Export test functions
window.testSongPlaying = testSongPlaying;
window.testSongStopping = testSongStopping;
window.toggleAutoToggle = toggleAutoToggle;
window.checkSettings = checkSettings;

console.log('Auto toggle test functions available:');
console.log('- testSongPlaying() - Simulate song playing');
console.log('- testSongStopping() - Simulate song stopping');
console.log('- toggleAutoToggle() - Toggle auto toggle setting');
console.log('- checkSettings() - Check current settings'); 