// Loading Animation Component
// Handles the loading animation with logo movement and status updates

class LoadingAnimation {
  constructor() {
    this.isAnimating = false;
    this.currentStep = 0;
    this.steps = [
      { text: 'Checking for updates...', duration: 2000 },
      { text: 'Initializing...', duration: 1500 },
      { text: 'Ready', duration: 1000 }
    ];
  }

  // Show loading animation
  async show() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.currentStep = 0;
    
    // Create loading overlay
    this.createLoadingOverlay();
    
    // Start animation sequence
    await this.runAnimationSequence();
    
    // Hide loading animation
    this.hide();
  }

  // Create loading overlay
  createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-container">
        <div class="loading-logo">soundcords</div>
        <div class="loading-status" id="loading-status">Initializing...</div>
        <div class="loading-spinner"></div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(-45deg, #0a0a0a, #1a1a1a, #0a0a0a, #1a1a1a);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #ffffff;
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .loading-container {
        text-align: center;
        max-width: 500px;
        padding: 40px;
      }
      
      .loading-logo {
        font-size: 36px;
        font-weight: 300;
        margin-bottom: 20px;
        letter-spacing: 2px;
        animation: logoMove 3s ease-in-out;
      }
      
      @keyframes logoMove {
        0% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
        100% { transform: translateY(0); }
      }
      
      .loading-status {
        font-size: 18px;
        margin-bottom: 20px;
        padding: 20px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #ffffff;
        animation: spin 1s ease-in-out infinite;
        margin-right: 10px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
  }

  // Run animation sequence
  async runAnimationSequence() {
    const statusEl = document.getElementById('loading-status');
    
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      
      // Update status text
      if (statusEl) {
        statusEl.textContent = step.text;
      }
      
      // Wait for step duration
      await this.delay(step.duration);
    }
  }

  // Hide loading animation
  hide() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 500);
    }
    
    this.isAnimating = false;
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingAnimation;
} 