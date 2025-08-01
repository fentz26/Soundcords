// Test script to verify extension works with user ID 463894270810783755

console.log('Testing SoundCloud Discord Presence Extension');
console.log('Target User ID:', '463894270810783755');

// Test function to simulate song detection
function testSongDetection() {
  const testSong = {
    title: 'Test Song for User 463894270810783755',
    artist: 'Test Artist',
    url: 'https://soundcloud.com/test',
    timestamp: Date.now()
  };

  console.log('Simulating song detection:', testSong);
  
  // Send test message to background script
  chrome.runtime.sendMessage({
    type: 'SONG_DETECTED',
    songInfo: testSong,
    isActive: true
  });
}

// Test function to check Discord presence
function testDiscordPresence() {
  console.log('Testing Discord presence for user 463894270810783755');
  
  // Send test presence data
  chrome.runtime.sendMessage({
    type: 'TEST_PRESENCE',
    settings: {
      language: 'en',
      enablePresence: true,
      showButton: true
    }
  });
}

// Test function to force song detection
function forceSongDetection() {
  console.log('Force triggering song detection...');
  
  // Send message to force check
  chrome.runtime.sendMessage({
    type: 'FORCE_CHECK_SONG'
  });
}

// Test function to get current song info
function getCurrentSongInfo() {
  console.log('Getting current song info...');
  
  chrome.runtime.sendMessage({
    type: 'GET_STATUS'
  }, (response) => {
    console.log('Current song info:', response);
  });
}

// Export test functions
window.testSongDetection = testSongDetection;
window.testDiscordPresence = testDiscordPresence;
window.forceSongDetection = forceSongDetection;
window.getCurrentSongInfo = getCurrentSongInfo;

console.log('Test functions available: testSongDetection(), testDiscordPresence(), forceSongDetection(), getCurrentSongInfo()'); 