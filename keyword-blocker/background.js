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
async function handleBeforeRequest(details) {
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

// Set up event listener for blocked requests
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(handleBeforeRequest);

// Listen for storage changes and update rules
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'local' && (changes.keywords || changes.notificationEnabled)) {
		updateBlockingRules();
	}
});

// Initial setup
updateBlockingRules();