// Window Limit Warning Page Script
// Displays warning and closes the window automatically

(async function () {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const windowLimit = parseInt(urlParams.get('limit')) || 3;
  const currentCount = parseInt(urlParams.get('current')) || 0;
  const windowId = parseInt(urlParams.get('windowId')) || 0;

  // Update the display
  document.getElementById('limit').textContent = windowLimit;
  document.getElementById('current').textContent = currentCount;

  // Get configuration from background script
  let countdown = 5; // Default
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (response.success && response.config.windowGracePeriod) {
      // Convert milliseconds to seconds
      countdown = Math.ceil(response.config.windowGracePeriod / 1000);
    }
  } catch (error) {
    console.log('Using default countdown:', error);
  }

  const countdownElement = document.getElementById('countdown');

  const countdownInterval = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      closeWindow();
    }
  }, 1000);

  // Close button handler
  document.getElementById('closeBtn').addEventListener('click', () => {
    clearInterval(countdownInterval);
    closeWindow();
  });

  // Close window function
  async function closeWindow() {
    try {
      // Send message to background script to close this window
      await chrome.runtime.sendMessage({
        action: 'closeWindowConfirmed',
        windowId: windowId,
        confirmed: true,
      });

      // As a fallback, try to close the current window
      window.close();
    } catch (error) {
      console.error('Error closing window:', error);
      // Force close as last resort
      window.close();
    }
  }

  // Handle Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearInterval(countdownInterval);
      closeWindow();
    }
  });

  // Prevent user from navigating away
  window.addEventListener('beforeunload', (e) => {
    // Let the window close naturally, don't prevent it
    return;
  });
})();
