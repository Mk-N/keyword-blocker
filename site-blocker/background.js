chrome.runtime.onInstalled.addListener(() => {
  loadKeywords();
});

chrome.runtime.onStartup.addListener(() => {
  loadKeywords();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateKeywords") {
    updateBlockingRules(message.keywords);
    sendResponse({ status: "updated" });
  }
});

function loadKeywords() {
  chrome.storage.local.get(["storedKeywords"], (result) => {
    const keywords = result.storedKeywords || [];
    updateBlockingRules(keywords);
  });
}

function updateBlockingRules(keywords) {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: keywords.map((_, id) => id + 1),
    addRules: keywords.map((keyword, id) => ({
      id: id + 1,
      priority: 1,
      action: {
        type: "block",
      },
      condition: {
        urlFilter: keyword,
        resourceTypes: ["main_frame"],
      },
    })),
  });
}
