async function loadKeywords() {
	const response = await fetch(chrome.runtime.getURL('keywords.txt'));
	const text = await response.text();
	const keywords = text.split('\n').map(keyword => keyword.trim()).filter(keyword => keyword);
	return keywords;
}

async function updateBlockingRules() {
	const keywords = await loadKeywords();
	const rules = keywords.map((keyword, index) => ({
		id: index + 1,
		priority: 1,
		action: { type: 'block' },
		condition: { urlFilter: `*${keyword}*`, resourceTypes: ['main_frame'] }
	}));

	// Update the dynamic rules with the new set of rules
	await chrome.declarativeNetRequest.updateDynamicRules({
		removeRuleIds: Array.from(Array(keywords.length).keys()).map(i => i + 1),
		addRules: rules
	});
}

chrome.runtime.onInstalled.addListener(updateBlockingRules);
chrome.runtime.onStartup.addListener(updateBlockingRules);