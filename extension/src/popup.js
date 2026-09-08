/**
 * Chrome Extension Popup Controller
 * Manages user triggers, tab checking, and live status polling.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const actionBtn = document.getElementById('actionBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const noticeText = document.getElementById('noticeText');

  let activeTabId = null;
  let pollInterval = null;
  let isCurrentlyScraping = false;

  // 1. Locate active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      showError('Cannot access current tab.');
      return;
    }

    const tab = tabs[0];
    activeTabId = tab.id;
    const url = tab.url || '';

    const isBookmarksUrl = url.includes('x.com/i/bookmarks') || url.includes('twitter.com/i/bookmarks');
    if (!isBookmarksUrl) {
      showDisabledState("Please navigate to x.com/i/bookmarks to scrape.");
      return;
    }

    // Tab is valid, poll initial status
    checkStatus();
    startPolling();
  } catch (err) {
    showError(err.message || 'Initialization failed.');
  }

  // 2. Button Action Handler
  actionBtn.addEventListener('click', async () => {
    if (!activeTabId) return;

    if (isCurrentlyScraping) {
      // User clicked "Stop & Export"
      actionBtn.disabled = true;
      actionBtn.textContent = 'Stopping...';
      try {
        await chrome.tabs.sendMessage(activeTabId, { action: 'STOP_SCRAPE' });
        setTimeout(checkStatus, 300);
      } catch (err) {
        showError('Failed to stop scraping: ' + err.message);
      }
    } else {
      // User clicked "Scrape Bookmarks"
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

      noticeText.textContent = 'Must be on x.com/i/bookmarks. Exports to JSON automatically.';
    }
  }

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(checkStatus, 600);
  }

  function showDisabledState(message) {
    actionBtn.disabled = true;
    actionBtn.textContent = 'Scrape Bookmarks';
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
