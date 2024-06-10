async function loadKeywordsAndNotificationState() {
	const keywordsResponse = await fetch(chrome.runtime.getURL('keywords.txt'));
	const keywordsText = await keywordsResponse.text();
	const keywords = keywordsText.split('\n').map(keyword => keyword.trim()).filter(keyword => keyword);

	// Load notification toggle state
	const storageData = await new Promise(resolve => {
		chrome.storage.local.get(['notificationEnabled', 'keywords'], data => resolve(data));
	});

	const notificationEnabled = storageData.notificationEnabled || false;
	const localKeywords = storageData.keywords ? storageData.keywords.split('\n').map(keyword => keyword.trim()).filter(keyword => keyword) : keywords;

	return { keywords: localKeywords, notificationEnabled };
}

async function updateBlockingRulesAndNotification(details) {
	const { keywords, notificationEnabled } = await loadKeywordsAndNotificationState();

	for (let keyword of keywords) {
		if (details.url.includes(keyword)) {
			if (notificationEnabled) {
				const notificationOptions = {
					type: 'basic',
					iconUrl: 'icon.png',
					title: 'Keyword Blocker',
					message: `The page was blocked because it contains the banned keyword: ${keyword}`
				};
				chrome.notifications.create(null, notificationOptions);
			}
			return { cancel: true };
		}
	}
	return { cancel: false };
}

chrome.webRequest.onBeforeRequest.addListener(
	updateBlockingRulesAndNotification,
	{ urls: ["<all_urls>"] },
	["blocking"]
);

// Listen for storage changes and update rules
chrome.storage.onChanged.addListener(async (changes, area) => {
	if (area === 'local' && (changes.keywords || changes.notificationEnabled)) {
		const { keywords } = await loadKeywordsAndNotificationState();
		const rules = keywords.map((keyword, index) => ({
			id: index + 1,
			priority: 1,
			action: { type: 'block' },
			condition: { urlFilter: keyword, resourceTypes: ['main_frame'] }
		}));

		await chrome.declarativeNetRequest.updateDynamicRules({
			removeRuleIds: Array.from(Array(keywords.length).keys()).map(i => i + 1),
			addRules: rules
		});
	}
});
