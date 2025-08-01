// Debug script for song detection - run this in browser console on SoundCloud
console.log('=== Soundcords Debug Script ===');

// Test 1: Check if content script is loaded
console.log('1. Checking if content script is loaded...');
if (window.SoundCloudMonitor) {
  console.log('✅ Content script is loaded');
} else {
  console.log('❌ Content script is not loaded');
}

// Test 2: Check if Chrome runtime is available
console.log('2. Checking Chrome runtime...');
if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
  console.log('✅ Chrome runtime is available');
} else {
  console.log('❌ Chrome runtime is not available');
}

// Test 3: Test song extraction
console.log('3. Testing song extraction...');
if (window.SoundCloudMonitor) {
  const songInfo = window.SoundCloudMonitor.extractSongInfo();
  console.log('Extracted song info:', songInfo);
  
  if (songInfo) {
    console.log('✅ Song detected:', songInfo.title, 'by', songInfo.artist);
  } else {
    console.log('❌ No song detected');
  }
}

// Test 4: Test communication with background script
console.log('4. Testing communication with background script...');
if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
  const testSong = {
    title: 'Debug Test Song',
    artist: 'Debug Test Artist',
    url: window.location.href,
    timestamp: Date.now()
  };
  
  chrome.runtime.sendMessage({
    type: 'SONG_DETECTED',
    songInfo: testSong,
    isActive: true
  }, (response) => {
    console.log('Response from background script:', response);
  });
  
  console.log('✅ Test message sent to background script');
} else {
  console.log('❌ Cannot send message to background script');
}

// Test 5: Check current page elements
console.log('5. Checking page elements...');
const titleElements = document.querySelectorAll('[class*="title"], h1, h2, .title');
console.log('Found title elements:', titleElements.length);
titleElements.forEach((el, i) => {
  console.log(`  ${i + 1}. "${el.textContent?.trim()}" (${el.className})`);
});

const artistElements = document.querySelectorAll('[class*="username"], [class*="artist"]');
console.log('Found artist elements:', artistElements.length);
artistElements.forEach((el, i) => {
  console.log(`  ${i + 1}. "${el.textContent?.trim()}" (${el.className})`);
});

// Test 6: Check audio playing state
console.log('6. Checking audio playing state...');
const playButton = document.querySelector('.playControl, .playbackControls__playPauseButton');
if (playButton) {
  const isPlaying = playButton.classList.contains('playing') || 
                   playButton.getAttribute('aria-label')?.toLowerCase().includes('pause');
  console.log('Play button found:', playButton.className);
  console.log('Is playing:', isPlaying);
} else {
  console.log('No play button found');
}

console.log('=== Debug complete ==='); 