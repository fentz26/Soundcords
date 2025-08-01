// Discord OAuth Content Script
// This script handles Discord OAuth redirects and captures authorization codes

console.log('Discord content script loaded');

// Check if this is an OAuth redirect page
function isOAuthRedirect() {
  const url = window.location.href;
  return url.includes('chrome-extension://') && url.includes('code=');
}

// Check if this is a Discord OAuth page
function isDiscordOAuthPage() {
  const url = window.location.href;
  return url.includes('discord.com/api/oauth2/authorize');
}

// Handle OAuth redirect
if (isOAuthRedirect()) {
  console.log('OAuth redirect detected');
  
  // Extract the authorization code from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    console.log('Authorization code captured:', code);
    
    // Send the code to the background script
    chrome.runtime.sendMessage({
      type: 'OAUTH_CODE_RECEIVED',
      code: code,
      redirectUrl: window.location.href
    });
    
    // Show success message
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        padding: 20px;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <h1 style="margin: 0 0 20px 0; font-size: 24px;">✅ Authorization Successful!</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">
            Your Discord account has been successfully connected to Soundcord.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.7;">
            You can close this tab now.
          </p>
        </div>
      </div>
    `;
    
    // Auto-close tab after 3 seconds
    setTimeout(() => {
      window.close();
    }, 3000);
  } else {
    console.error('No authorization code found in URL');
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        text-align: center;
        padding: 20px;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <h1 style="margin: 0 0 20px 0; font-size: 24px;">❌ Authorization Failed</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">
            No authorization code was received. Please try again.
          </p>
        </div>
      </div>
    `;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_OAUTH_PAGE') {
    const isOAuthPage = isDiscordOAuthPage();
    console.log('Checking if this is an OAuth page:', isOAuthPage);
    sendResponse({ isOAuthPage: isOAuthPage });
  }
}); 