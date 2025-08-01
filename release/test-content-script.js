// Test script to verify content script song detection
console.log('Testing content script song detection...');

// Simulate a song being detected
const testSong = {
  title: 'Test Song from Content Script',
  artist: 'Test Artist from Content Script',
  url: 'https://soundcloud.com/test-song',
  timestamp: Date.now()
};

// Send message to background script
if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
  chrome.runtime.sendMessage({
    type: 'SONG_DETECTED',
    songInfo: testSong,
    isActive: true
  });
  console.log('Sent test song to background script:', testSong);
} else {
  console.error('Chrome runtime API not available');
}

// Also test the content script's extractSongInfo method
if (window.SoundCloudMonitor) {
  console.log('Testing extractSongInfo method...');
  const songInfo = window.SoundCloudMonitor.extractSongInfo();
  console.log('Extracted song info:', songInfo);
} else {
  console.log('SoundCloudMonitor not available in window object');
} 