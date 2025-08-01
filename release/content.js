class SoundCloudMonitor {
  constructor() {
    this.currentSong = null;
    this.observer = null;
    this.isActive = false;
    this.init();
  }

  init() {
    this.startMonitoring();
    this.setupMessageListener();
  }

  startMonitoring() {
    // Initial check
    this.checkForSong();
    
    // Set up observer for dynamic content changes
    this.setupObserver();
    
    // Periodic check as fallback
    setInterval(() => {
      this.checkForSong();
    }, 5000);
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          shouldCheck = true;
        }
      });
      
      if (shouldCheck) {
        setTimeout(() => this.checkForSong(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid']
    });
  }

  checkForSong() {
    console.log('=== Content Script: Checking for song ===');
    const songInfo = this.extractSongInfo();
    
    if (songInfo && this.hasSongChanged(songInfo)) {
      console.log('✅ New song detected:', songInfo);
      this.currentSong = songInfo;
      this.notifyBackground(songInfo);
    } else if (!songInfo && this.currentSong) {
      console.log('❌ Song stopped playing');
      this.currentSong = null;
      this.notifyBackground(null);
    } else if (songInfo) {
      console.log('ℹ️ Same song still playing:', songInfo.title);
    } else {
      console.log('ℹ️ No song detected');
    }
  }

  extractSongInfo() {
    console.log('Extracting song info from SoundCloud page...');
    
    // Try multiple selectors for different SoundCloud layouts
    const titleSelectors = [
      // Main player - updated selectors
      '.playbackSoundBadge__titleLink',
      '.playControls__title',
      '.playbackControls__title',
      '.playbackSoundBadge__title',
      '.soundTitle__title',
      '.playbackControls__titleLink',
      '.playbackControls__title',
      // New selectors for current SoundCloud layout
      '[data-testid="playback-controls"] .playbackControls__title',
      '[data-testid="playback-controls"] .playbackControls__titleLink',
      '.playbackControls__titleLink',
      // Additional selectors
      '.playbackControls__title a',
      '.playbackControls__title span',
      // Fallback selectors
      'h1.soundTitle__title',
      '.soundTitle__titleLink',
      // Generic selectors
      '[class*="title"]',
      '[class*="Title"]',
      // New SoundCloud selectors
      '.playbackControls__titleLink span',
      '.playbackControls__title span',
      '.playbackControls__title a span',
      // Additional fallbacks
      'h1',
      'h2',
      '.title',
      '[class*="track"]',
      '[class*="song"]'
    ];

    let titleElement = null;
    let artistElement = null;

    // Find title with debugging
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement) {
        console.log('Found title element with selector:', selector, 'Text:', titleElement.textContent);
        break;
      }
    }

    // Find artist - try more comprehensive selectors
    const artistSelectors = [
      '.playbackSoundBadge__usernameLink',
      '.playbackControls__username',
      '.soundTitle__username',
      '.playbackControls__usernameLink',
      '.playbackSoundBadge__username',
      '.playControls__username',
      // Try to find artist in the player bar
      '.playbackControls__usernameLink a',
      '.playbackControls__username a',
      // Try to find artist in the current track info
      '[data-testid="playback-controls"] .playbackControls__username',
      '[data-testid="playback-controls"] .playbackControls__usernameLink',
      // Additional artist selectors
      '.playbackControls__username span',
      '.playbackControls__usernameLink span',
      // Generic artist selectors
      '[class*="username"]',
      '[class*="Username"]',
      '[class*="artist"]',
      '[class*="Artist"]'
    ];

    for (const selector of artistSelectors) {
      artistElement = document.querySelector(selector);
      if (artistElement) {
        console.log('Found artist element with selector:', selector, 'Text:', artistElement.textContent);
        break;
      }
    }

    // Check if we're on a track page
    if (!titleElement) {
      titleElement = document.querySelector('h1.soundTitle__title');
      artistElement = document.querySelector('.soundTitle__username');
      if (titleElement) console.log('Found title on track page:', titleElement.textContent);
    }

    // Additional fallback: try to extract from the page title
    if (!titleElement && document.title) {
      console.log('Trying to extract from page title:', document.title);
      const titleMatch = document.title.match(/^(.+?)\s+by\s+(.+?)\s+\|/);
      if (titleMatch) {
        titleElement = { textContent: titleMatch[1].trim() };
        artistElement = { textContent: titleMatch[2].trim() };
        console.log('Extracted from page title - Title:', titleMatch[1], 'Artist:', titleMatch[2]);
      } else {
        // Try simpler pattern
        const simpleMatch = document.title.match(/^(.+?)\s+by\s+(.+?)$/);
        if (simpleMatch) {
          titleElement = { textContent: simpleMatch[1].trim() };
          artistElement = { textContent: simpleMatch[2].trim() };
          console.log('Extracted from page title (simple) - Title:', simpleMatch[1], 'Artist:', simpleMatch[2]);
        }
      }
    }

    // Additional fallback: try to find any text that looks like a song title
    if (!titleElement) {
      console.log('Trying to find song title in page content...');
      const possibleTitles = document.querySelectorAll('h1, h2, h3, .title, [class*="title"]');
      for (const element of possibleTitles) {
        const text = element.textContent?.trim();
        if (text && text.length > 3 && text.length < 100) {
          console.log('Found possible title:', text);
          titleElement = element;
          break;
        }
      }
    }

    if (!titleElement) {
      console.log('No title element found');
      return null;
    }

    const title = titleElement.textContent?.trim();
    let artist = artistElement?.textContent?.trim() || 'Unknown Artist';
    
    // Clean up artist name (remove extra whitespace, etc.)
    if (artist && artist !== 'Unknown Artist') {
      artist = artist.replace(/\s+/g, ' ').trim();
    }
    
    // Try to extract the specific song URL from the player
    let songUrl = window.location.href;
    
    // Try to find the specific song URL from the player elements
    const songLinkSelectors = [
      '.playbackSoundBadge__titleLink',
      '.playbackControls__titleLink',
      '.playControls__titleLink',
      '.soundTitle__titleLink',
      '[data-testid="playback-controls"] .playbackControls__titleLink',
      '.playbackControls__title a',
      '.playControls__title a',
      '.soundTitle__title a'
    ];
    
    for (const selector of songLinkSelectors) {
      const linkElement = document.querySelector(selector);
      if (linkElement && linkElement.href) {
        songUrl = linkElement.href;
        console.log('Found specific song URL:', songUrl);
        break;
      }
    }
    
    // If we couldn't find a specific song URL, try to construct it from the page URL
    if (songUrl === window.location.href) {
      // Check if we're on a track page (individual song)
      const trackMatch = window.location.pathname.match(/\/[^\/]+\/[^\/]+$/);
      if (trackMatch) {
        console.log('Using current page URL as song URL (track page)');
      } else {
        console.log('Warning: Could not find specific song URL, using page URL (may be playlist)');
        
        // Try to extract from page metadata
        const metaUrl = document.querySelector('meta[property="og:url"]')?.content ||
                       document.querySelector('link[rel="canonical"]')?.href;
        if (metaUrl && metaUrl !== window.location.href) {
          songUrl = metaUrl;
          console.log('Found song URL from metadata:', songUrl);
        }
        
        // Try to extract from structured data
        const structuredData = document.querySelector('script[type="application/ld+json"]');
        if (structuredData) {
          try {
            const data = JSON.parse(structuredData.textContent);
            if (data.url && data.url !== window.location.href) {
              songUrl = data.url;
              console.log('Found song URL from structured data:', songUrl);
            }
          } catch (error) {
            console.log('Could not parse structured data');
          }
        }
      }
    }

    // Check if audio is actually playing
    const isPlaying = this.isAudioPlaying();

    console.log('Extracted song info:', { title, artist, url: songUrl, isPlaying });

    if (!title || !isPlaying) {
      console.log('Missing title or not playing, returning null');
      return null;
    }

    return {
      title: title,
      artist: artist,
      url: songUrl,
      timestamp: Date.now()
    };
  }

  isAudioPlaying() {
    console.log('Checking if audio is playing...');
    
    // Check for play button state
    const playButton = document.querySelector('.playControl');
    if (playButton) {
      const isPlaying = playButton.classList.contains('playing');
      console.log('Play button state:', isPlaying);
      return isPlaying;
    }

    // Check for other play indicators
    const playingIndicators = [
      '.playbackControls__playPauseButton.playing',
      '.playControl.playing',
      '[data-testid="play-button"].playing',
      // Additional play state indicators
      '.playbackControls__playPauseButton[aria-label*="pause"]',
      '.playControl[aria-label*="pause"]',
      '[data-testid="play-button"][aria-label*="pause"]',
      // Generic playing indicators
      '[class*="playing"]',
      '[class*="Playing"]',
      // New SoundCloud indicators
      '.playbackControls__playPauseButton[aria-label*="Pause"]',
      '.playControl[aria-label*="Pause"]',
      '[data-testid="play-button"][aria-label*="Pause"]',
      // Check for pause button (indicates playing)
      '.playbackControls__playPauseButton[aria-label*="pause"]',
      '.playControl[aria-label*="pause"]'
    ];

    for (const selector of playingIndicators) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('Found playing indicator:', selector);
        return true;
      }
    }

    // Check for audio element state
    const audioElements = document.querySelectorAll('audio, video');
    for (const audio of audioElements) {
      if (!audio.paused && !audio.ended && audio.currentTime > 0) {
        console.log('Found playing audio/video element');
        return true;
      }
    }

    // Check for progress bar indicating playback
    const progressBars = document.querySelectorAll('[class*="progress"], [class*="Progress"]');
    for (const bar of progressBars) {
      const style = window.getComputedStyle(bar);
      if (style.width && style.width !== '0px' && style.width !== '0%') {
        console.log('Found progress bar with width:', style.width);
        return true;
      }
    }

    // Check for any element with "pause" in aria-label (indicates playing)
    const pauseElements = document.querySelectorAll('[aria-label*="pause"], [aria-label*="Pause"]');
    for (const element of pauseElements) {
      if (element.getAttribute('aria-label').toLowerCase().includes('pause')) {
        console.log('Found pause element (indicates playing):', element.getAttribute('aria-label'));
        return true;
      }
    }

    console.log('No playing indicators found');
    return false;
  }

  hasSongChanged(newSong) {
    if (!this.currentSong) return true;
    
    return (
      newSong.title !== this.currentSong.title ||
      newSong.artist !== this.currentSong.artist ||
      newSong.url !== this.currentSong.url
    );
  }

  notifyBackground(songInfo) {
    if (songInfo) {
      console.log('=== Content Script: Notifying Background ===');
      console.log('Song URL being sent:', songInfo.url);
      console.log('Full song info:', songInfo);
      
      chrome.runtime.sendMessage({
        type: 'SONG_DETECTED',
        songInfo: songInfo,
        isActive: true
      }, (response) => {
        console.log('Background response:', response);
      });
    } else {
      console.log('=== Content Script: Clearing Song ===');
      chrome.runtime.sendMessage({
        type: 'SONG_DETECTED',
        songInfo: null,
        isActive: false
      });
    }
  }

  setupMessageListener() {
    try {
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'GET_CURRENT_SONG') {
            sendResponse({
              songInfo: this.currentSong,
              isActive: !!this.currentSong
            });
          } else if (message.type === 'FORCE_CHECK_SONG') {
            console.log('Force checking for song...');
            this.checkForSong();
            sendResponse({ success: true });
          }
        });
      } else {
        console.warn('Chrome runtime API not available for message listener');
      }
    } catch (error) {
      console.error('Failed to setup message listener:', error);
    }
  }
}

// Initialize monitor when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SoundCloudMonitor();
  });
} else {
  new SoundCloudMonitor();
} 