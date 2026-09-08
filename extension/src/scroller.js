/**
 * Auto-scrolling and page condition detection for X (Twitter) bookmarks.
 */

/**
 * Returns a promise that resolves after the specified milliseconds.
 * @param {number} ms 
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a random integer delay between min and max.
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function getRandomDelay(min = 800, max = 1500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks the DOM for known rate-limiting, authentication walls, or empty page errors.
 * @param {Document} doc 
 * @returns {{ hasError: boolean, errorType?: string, message?: string }}
 */
export function checkPageStatus(doc = document) {
  // 1. Verify URL is on bookmarks
  const path = (doc.location && doc.location.pathname) ? doc.location.pathname : window.location?.pathname || '';
  if (path && !path.includes('/i/bookmarks')) {
    return {
      hasError: true,
      errorType: 'INVALID_PAGE',
      message: "Check you're on the bookmarks page (x.com/i/bookmarks)"
    };
  }

  // 2. Check for login / auth wall
  const loginModal = doc.querySelector('[data-testid="sheetDialog"], [data-testid="login"]');
  if (loginModal) {
    return {
      hasError: true,
      errorType: 'LOGIN_REQUIRED',
      message: 'Login required'
    };
  }

  const allText = doc.body ? (doc.body.innerText || doc.body.textContent || '') : '';
  if (allText.includes('Log in to X') || allText.includes('Sign in to X')) {
    // Make sure it's not just a stray navigation link
    if (doc.querySelector('a[href="/login"]') && !doc.querySelector('article')) {
      return {
        hasError: true,
        errorType: 'LOGIN_REQUIRED',
        message: 'Login required'
      };
    }
  }

  // 3. Check for rate limit or "Something went wrong"
  if (
    allText.includes('Something went wrong. Try reloading.') ||
    allText.includes('Rate limit exceeded') ||
    allText.includes('Cannot retrieve Tweets at this time')
  ) {
    return {
      hasError: true,
      errorType: 'RATE_LIMITED',
      message: 'Rate limited by X, try again later'
    };
  }

  return { hasError: false };
}

/**
 * Checks whether an active loading spinner or progress bar is present on the timeline.
 * @param {Document} doc 
 * @returns {boolean}
 */
export function isLoadingSpinnerVisible(doc = document) {
  const spinner = doc.querySelector(
    '[role="progressbar"], svg[aria-label="Loading…"], [data-testid="spinner"], [data-testid="primaryColumn"] svg circle'
  );
  return !!spinner;
}

/**
 * Executes a single scroll increment.
 * @param {number} amount 
 */
export function scrollByAmount(amount = 800) {
  window.scrollBy({
    top: amount,
    left: 0,
    behavior: 'smooth'
  });
}
