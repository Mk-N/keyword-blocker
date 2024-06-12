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

// Simulate lookahead and lookbehind manually
function matchesPattern(url, pattern) {
	// Check for negative lookahead
	if (pattern.includes('(?!')) {
		const parts = pattern.split('(?!');
		const before = parts[0];
		const negativeLookahead = parts[1].slice(0, -1); // remove closing )
		return url.includes(before) && !url.includes(before + negativeLookahead);
	}

	// Check for positive lookahead
	if (pattern.includes('(?=')) {
		const parts = pattern.split('(?=');
		const before = parts[0];
		const positiveLookahead = parts[1].slice(0, -1); // remove closing )
		return url.includes(before) && url.includes(before + positiveLookahead);
	}

	// Check for negative lookbehind
	if (pattern.includes('(?<!')) {
		const parts = pattern.split('(?<!');
		const after = parts[1];
		const negativeLookbehind = parts[0].slice(0, -1); // remove opening (
		return url.includes(after) && !url.includes(negativeLookbehind + after);
	}

	// Check for positive lookbehind
	if (pattern.includes('(?<=(')) {
		const parts = pattern.split('(?<=(');
		const after = parts[1];
		const positiveLookbehind = parts[0].slice(0, -1); // remove opening (
		return url.includes(after) && url.includes(positiveLookbehind + after);
	}

	// Default regex matching
	const regex = new RegExp(pattern);
	return regex.test(url);
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
		if (matchesPattern(details.url, keyword) && notificationEnabled) {
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