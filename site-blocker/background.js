let regexKeywords = [];

chrome.runtime.onInstalled.addListener(() => {
  loadKeywords();
});

chrome.runtime.onStartup.addListener(() => {
  loadKeywords();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateKeywords") {
    regexKeywords = message.keywords;
    optimizeKeywords();
    updateBlockingRules();
    sendResponse({ status: "updated" });
  }
});

function loadKeywords() {
  chrome.storage.local.get(["storedKeywords"], (result) => {
    regexKeywords = result.storedKeywords || [];
    optimizeKeywords();
    updateBlockingRules();
  });
}

function optimizeKeywords() {
  // Example optimization: remove substrings that are already matched by other keywords
  regexKeywords = regexKeywords.filter((regex, index, arr) => {
    return !arr.some((r, i) => i !== index && r.includes(regex));
  });
}

function updateBlockingRules() {
  const rules = regexKeywords.map((regex, id) => ({
    id: id + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: chrome.runtime.getURL(
          `blocked.html?keywords=${encodeURIComponent(
            JSON.stringify(
              regexKeywords.filter((r) => new RegExp(r, "i").test(regex))
            )
          )}`
        ),
      },
    },
    condition: {
      urlFilter: regex,
      resourceTypes: ["main_frame"],
    },
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: regexKeywords.map((_, id) => id + 1),
    addRules: rules,
  });
}
