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

function getMatchingKeywords(url) {
  return regexKeywords.filter((regex) => new RegExp(regex, "i").test(url));
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
            getMatchingKeywords(regex).join(",")
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

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const matchingKeywords = getMatchingKeywords(details.url);
    if (matchingKeywords.length > 0) {
      return {
        redirectUrl: chrome.runtime.getURL(
          `blocked.html?keywords=${encodeURIComponent(
            matchingKeywords.join(",")
          )}`
        ),
      };
    }
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
