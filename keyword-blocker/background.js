// Function to perform regex matching with support for recursive handling of lookaheads
function regex_match(url, regex_patterns) {
	for (let i = 0; i < regex_patterns.length; i++) {
		let pattern = regex_patterns[i];

		// Validate regex pattern before proceeding
		if (!isValidRegexPattern(pattern)) {
			continue; // Skip invalid patterns
		}

		// Handle positive lookahead (?=...)
		if (pattern.includes('(?=')) {
			let parts = pattern.split(/(?=\(\?=[^)]+\))/);
			let mainPattern = parts[0];
			let lookaheadPatterns = parts.slice(1).map(part => part.slice(3, -1)); // Remove leading '(?=' and trailing ')'

			if (!url.match(new RegExp(mainPattern))) {
				continue; // Skip if main pattern doesn't match
			}

			let remainingUrl = url;
			let lookaheadMatched = true;

			for (let j = 0; j < lookaheadPatterns.length; j++) {
				let lookaheadPattern = lookaheadPatterns[j];

				// Handle recursive call for each lookahead
				if (!recursiveRegexMatch(remainingUrl, lookaheadPattern)) {
					lookaheadMatched = false;
					break; // Skip if any lookahead pattern doesn't match
				}

				// Update remaining URL after matching lookahead
				remainingUrl = remainingUrl.substring(remainingUrl.search(new RegExp(lookaheadPattern)) + lookaheadPattern.length);
			}

			if (lookaheadMatched) {
				return true; // All patterns matched, block the URL
			}
		}

		// Handle negative lookahead (?!...)
		else if (pattern.includes('(?!')) {
			let parts = pattern.split(/(?=\(\?![^)]+\))/);
			let mainPattern = parts[0];
			let lookaheadPatterns = parts.slice(1).map(part => part.slice(3, -1)); // Remove leading '(?!' and trailing ')'

			if (!url.match(new RegExp(mainPattern))) {
				continue; // Skip if main pattern doesn't match
			}

			let remainingUrl = url;
			let lookaheadMatched = true;

			for (let j = 0; j < lookaheadPatterns.length; j++) {
				let lookaheadPattern = lookaheadPatterns[j];

				// Handle recursive call for each lookahead
				if (recursiveRegexMatch(remainingUrl, lookaheadPattern)) {
					lookaheadMatched = false;
					break; // Skip if any negative lookahead pattern matches
				}

				// Update remaining URL after matching lookahead
				remainingUrl = remainingUrl.substring(remainingUrl.search(new RegExp(lookaheadPattern)) + lookaheadPattern.length);
			}

			if (lookaheadMatched) {
				return true; // Main pattern matched and no negative lookahead pattern matched, block the URL
			}
		}

		// Regular pattern matching without lookaheads
		else {
			if (url.match(new RegExp(pattern))) {
				return true; // Match found, block the URL
			}
		}
	}

	return false; // No match found, allow the URL
}

// Helper function to validate regex patterns
function isValidRegexPattern(pattern) {
	try {
		new RegExp(pattern);
		return true;
	} catch (error) {
		console.error('Invalid regex pattern:', pattern);
		return false;
	}
}

// Function to notify when a page is blocked
async function handleBlockedRequest(details) {
	const { keywords, notificationEnabled } = await loadKeywordsAndNotificationState();

	for (let keyword of keywords) {
		if (regex_match(details.url, [keyword]) && notificationEnabled) {
			const notificationOptions = {
				type: 'basic',
				iconUrl: 'icon.png',
				title: 'Keyword Blocker',
				message: `The page was blocked because it contains the banned keyword pattern: ${keyword}`
			};
			chrome.notifications.create(null, notificationOptions);
			break;
		}
	}

	// Dynamically block or allow based on regex patterns
	if (regex_match(details.url, keywords)) {
		return { cancel: true }; // Block the request
	} else {
		return { cancel: false }; // Allow the request
	}
}

// Initialize the extension
async function initialize() {
	await updateBlockingRules();
}

// Log the content of local storage
chrome.storage.local.get(null, function (items) {
	console.log('Local Storage:', items);
});

// Listen for storage changes and update rules
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'local' && (changes.keywords || changes.notificationEnabled)) {
		updateBlockingRules();
	}
});

// Service worker events for initialization
chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);