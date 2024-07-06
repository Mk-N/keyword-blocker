chrome.runtime.onInstalled.addListener(() => {
  loadKeywords().then((keywords) => {
    const rules = generateRules(keywords);
    updateRules(rules);
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.keywords) {
    const keywords = changes.keywords.newValue;
    const rules = generateRules(keywords);
    updateRules(rules);
  }
});

function loadKeywords() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["keywords"], (result) => {
      resolve(result.keywords || []);
    });
  });
}

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

function generateRules(keywords) {
  const optimizedKeywords = optimizeKeywords(keywords);
  const rules = optimizedKeywords.map((keyword, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url:
          chrome.runtime.getURL("src/blockPage.html") +
          "?keyword=" +
          encodeURIComponent(keyword),
      },
    },
    condition: {
      urlFilter: `*://*/*`,
      regexFilter: keyword,
    },
  }));

  return rules;
}

function updateRules(rules) {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 1000 }, (_, i) => i + 1),
    addRules: rules,
  });
}
