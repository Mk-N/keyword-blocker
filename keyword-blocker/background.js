// Load keywords and notification state from storage
async function loadKeywordsAndNotificationState() {
	return new Promise((resolve) => {
		chrome.storage.local.get(['keywords', 'notificationEnabled'], (result) => {
			const keywords = result.keywords || [];
			const notificationEnabled = result.notificationEnabled || false;
			resolve({ keywords, notificationEnabled });
		});
	});
}

// Function to perform regex matching with support for recursive handling of lookaheads
function regex_match(url, regex_patterns) {
	for (let i = 0; i < regex_patterns.length; i++) {
		let pattern = regex_patterns[i];

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

// Helper function for recursive regex matching
function recursiveRegexMatch(url, pattern) {
	if (!pattern.includes('(?=')) {
		return url.match(new RegExp(pattern));
	}

	let parts = pattern.split(/(?=\(\?=[^)]+\))/);
	let mainPattern = parts[0];
	let lookaheadPattern = parts[1].slice(3, -1); // Remove leading '(?=' and trailing ')'

	let remainingUrl = url;

	if (!url.match(new RegExp(mainPattern))) {
		return false; // Skip if main pattern doesn't match
	}

	// Update remaining URL after matching main pattern
	remainingUrl = remainingUrl.substring(remainingUrl.search(new RegExp(mainPattern)) + mainPattern.length);

	// Handle recursive call for lookahead
	return recursiveRegexMatch(remainingUrl, lookaheadPattern);
}

// Update the blocking rules based on the loaded keywords
async function updateBlockingRules() {
	const { keywords } = await loadKeywordsAndNotificationState();

	const rules = keywords.map((keyword, index) => ({
		id: index + 1,
		priority: 1,
		action: { type: 'block' },
		condition: { regexFilter: keyword, resourceTypes: ['main_frame'] }
	}));

	// Remove old rules and add new ones
	chrome.declarativeNetRequest.getDynamicRules(existingRules => {
		let removeRuleIds = existingRules.map(rule => rule.id);
		chrome.declarativeNetRequest.updateDynamicRules({
			removeRuleIds: removeRuleIds,
			addRules: rules
		}, () => {
			if (chrome.runtime.lastError) {
				console.error('Error updating dynamic rules:', chrome.runtime.lastError.message);
			} else {
				console.log("Rules updated successfully with regex support");
			}
		});
	});
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