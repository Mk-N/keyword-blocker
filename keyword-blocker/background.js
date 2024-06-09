// background.js
async function loadKeywordsAndNotificationState() {
	const keywordsResponse = await fetch(chrome.runtime.getURL('keywords.txt'));
	const keywordsText = await keywordsResponse.text();
	const keywords = keywordsText.split('\n').map(keyword => keyword.trim()).filter(keyword => keyword);

	// Load notification toggle state
	let notificationEnabled = true; // Default value
	const storageData = await new Promise(resolve => {
		chrome.storage.local.get('notificationEnabled', data => resolve(data));
	});
	if (storageData.hasOwnProperty('notificationEnabled')) {
		notificationEnabled = storageData.notificationEnabled;
	}

	return { keywords, notificationEnabled };
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