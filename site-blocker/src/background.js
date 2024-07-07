// Initialize the extension by loading the saved keywords and adding the rules
chrome.runtime.onInstalled.addListener(() => {
  updateBlockedSites();
});

// Listen for changes in the storage and update the rules accordingly
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.keywords) {
    updateBlockedSites();
  }
});

// Function to update the blocked sites based on the saved keywords
function updateBlockedSites() {
  chrome.storage.local.get("keywords", (result) => {
    const keywords = result.keywords || [];
    const rules = keywords.map((keyword, index) => {
      return {
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: { regexFilter: keyword },
      };
    });

    // Clear existing rules and add new ones
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map((rule) => rule.id),
      addRules: rules,
    });
  });
}

// Function to optimize keywords by removing redundant ones
function optimizeKeywords(keywords) {
  let optimized = [];

  for (let i = 0; i < keywords.length; i++) {
    let isRedundant = false;
    for (let j = 0; j < keywords.length; j++) {
      if (i !== j && keywords[j].includes(keywords[i])) {
        isRedundant = true;
        break;
      }
    }
    if (!isRedundant) {
      optimized.push(keywords[i]);
    }
  }

  return optimized;
}
