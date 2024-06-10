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

// Update the blocking rules based on the loaded keywords
async function updateBlockingRules() {
	const { keywords } = await loadKeywordsAndNotificationState();

	const rules = keywords.map((keyword, index) => ({
		id: index + 1,
		priority: 1,
		action: { type: 'block' },
		condition: { urlFilter: `*${keyword}*`, resourceTypes: ['main_frame'] }
	}));

	chrome.declarativeNetRequest.updateDynamicRules({
		removeRuleIds: Array.from({ length: 1000 }, (_, i) => i + 1),
		addRules: rules
	});
}

// Function to notify when a page is blocked
async function handleBlockedRequest(details) {
	const { keywords, notificationEnabled } = await loadKeywordsAndNotificationState();

	for (let keyword of keywords) {
		if (details.url.includes(keyword) && notificationEnabled) {
			const notificationOptions = {
				type: 'basic',
				iconUrl: 'icon.png',
				title: 'Keyword Blocker',
				message: `The page was blocked because it contains the banned keyword: ${keyword}`
			};
			chrome.notifications.create(null, notificationOptions);
			break;
		}
	}
}

// Initial setup to update rules and handle blocked requests
async function initialize() {
	await updateBlockingRules();

	// Example function to get matched rules for debugging
	async function getMatchedRules() {
		const matchedRules = await chrome.declarativeNetRequest.getMatchedRules();
		console.log('Matched Rules:', matchedRules);
	}

	// Uncomment this line to debug matched rules
	// getMatchedRules();
}

chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

// Listen for storage changes and update rules
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'local' && (changes.keywords || changes.notificationEnabled)) {
		updateBlockingRules();
	}
});

// Handle blocked requests and notify if necessary
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(handleBlockedRequest);
