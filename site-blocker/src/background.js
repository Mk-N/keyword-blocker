chrome.storage.local.get("keywords", (result) => {
  const keywords = result.keywords || [];

  if (keywords.length > 0) {
    const rules = keywords.map((keyword, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: "block" },
      condition: { regexFilter: keyword },
    }));

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map((rule) => rule.id),
      addRules: rules,
    });
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.keywords) {
    const keywords = changes.keywords.newValue;

    if (keywords.length > 0) {
      const rules = keywords.map((keyword, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: { regexFilter: keyword },
      }));

      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map((rule) => rule.id),
        addRules: rules,
      });
    } else {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map((rule) => rule.id),
      });
    }
  }
});
