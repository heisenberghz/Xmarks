/**
 * Chrome Extension Popup Controller
 * Manages dashboard launching, live capture status, and bulk scraper.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const openDashboardBtn = document.getElementById('openDashboardBtn');
  const openSidePanelBtn = document.getElementById('openSidePanelBtn');
  const actionBtn = document.getElementById('actionBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const noticeText = document.getElementById('noticeText');

  let activeTabId = null;
  let pollInterval = null;
  let isCurrentlyScraping = false;
  let isBookmarksPage = false;

  // 1. Dashboard Launcher Handlers (Always available on any tab)
  openDashboardBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    window.close();
  });

  openSidePanelBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
    window.close();
  });

  // 2. Locate active tab for bulk scraper
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      const tab = tabs[0];
      activeTabId = tab.id;
      const url = tab.url || '';

      isBookmarksPage =
        url.includes('x.com/i/bookmarks') ||
        url.includes('twitter.com/i/bookmarks') ||
        url.includes('x.com/i/history') ||
        url.includes('twitter.com/i/history');

      if (!isBookmarksPage) {
        showNavigateState();
      } else {
        checkStatus();
        startPolling();
      }
    }
  } catch (err) {
    showError(err.message || 'Initialization failed.');
  }

  // 3. Bulk Scraper Button Action Handler
  actionBtn.addEventListener('click', async () => {
    if (!isBookmarksPage) {
      chrome.tabs.create({ url: 'https://x.com/i/bookmarks' });
      window.close();
      return;
    }

    if (!activeTabId) return;

    if (isCurrentlyScraping) {
      actionBtn.disabled = true;
      actionBtn.textContent = 'Stopping...';
      try {
        await chrome.tabs.sendMessage(activeTabId, { action: 'STOP_SCRAPE' });
        setTimeout(checkStatus, 300);
      } catch (err) {
        showError('Failed to stop scraping: ' + err.message);
      }
    } else {
      actionBtn.disabled = true;
      actionBtn.textContent = 'Starting...';
      try {
        await chrome.tabs.sendMessage(activeTabId, { action: 'START_SCRAPE' });
        setTimeout(checkStatus, 300);
      } catch (err) {
        showError('Please refresh the bookmarks page and try again.');
      }
    }
  });

  // 3. Status Query & UI Updater
  async function checkStatus() {
    if (!activeTabId) return;

    try {
      const response = await chrome.tabs.sendMessage(activeTabId, { action: 'GET_STATUS' });
      if (!response) {
        updateUI({ isRunning: false, status: 'Idle', count: 0 });
        return;
      }

      isCurrentlyScraping = response.isRunning;
      updateUI(response);
    } catch (err) {
      // Content script might not be injected yet if page just opened
      updateUI({
        isRunning: false,
        status: 'Ready (Refresh page if unresponsive)',
        count: 0,
      });
    }
  }

  function updateUI(state) {
    actionBtn.disabled = false;

    if (state.isRunning) {
      actionBtn.textContent = 'Stop & Export';
      actionBtn.className = 'btn btn-stop';
      statusDot.className = 'status-indicator active';
      statusText.textContent = state.status || `Scraping... (${state.count} collected)`;
      noticeText.textContent = 'Scraping in progress. You can close this popup anytime.';
    } else {
      actionBtn.textContent = 'Scrape Bookmarks';
      actionBtn.className = 'btn btn-primary';

      if (state.lastError || (state.status && state.status.startsWith('Error:'))) {
        statusDot.className = 'status-indicator error';
        statusText.textContent = state.status || `Error: ${state.lastError}`;
      } else if (state.status && state.status.startsWith('Done')) {
        statusDot.className = 'status-indicator done';
        statusText.textContent = state.status;
      } else {
        statusDot.className = 'status-indicator';
        statusText.textContent = state.status || 'Idle';
      }

      noticeText.textContent = 'Ensure "Bookmarks" tab is active. Exports to JSON automatically.';
    }
  }

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(checkStatus, 600);
  }

  function showNavigateState() {
    actionBtn.disabled = false;
    actionBtn.textContent = 'Go to Bookmarks on X';
    actionBtn.className = 'btn btn-primary';
    statusDot.className = 'status-indicator active';
    statusText.textContent = 'Live Capture Active';
    noticeText.textContent = 'Auto-captures bookmarks on X. Click above to visit bookmarks page.';
    if (pollInterval) clearInterval(pollInterval);
  }

  function showDisabledState(message) {
    actionBtn.disabled = true;
    actionBtn.textContent = 'Scrape Bookmarks Page';
    actionBtn.className = 'btn btn-primary';
    statusDot.className = 'status-indicator error';
    statusText.textContent = 'Inactive';
    noticeText.textContent = message;
    if (pollInterval) clearInterval(pollInterval);
  }

  function showError(msg) {
    statusDot.className = 'status-indicator error';
    statusText.textContent = `Error: ${msg}`;
    actionBtn.disabled = true;
    if (pollInterval) clearInterval(pollInterval);
  }

  window.addEventListener('unload', () => {
    if (pollInterval) clearInterval(pollInterval);
  });
});
