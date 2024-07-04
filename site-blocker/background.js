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
    sendResponse({ status: "updated" });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    for (let regex of regexKeywords) {
      let re = new RegExp(regex, "i");
      if (re.test(details.url)) {
        return {
          redirectUrl: chrome.runtime.getURL(
            `blocked.html?keyword=${encodeURIComponent(regex)}`
          ),
        };
      }
    }
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

function loadKeywords() {
  chrome.storage.local.get(["storedKeywords"], (result) => {
    regexKeywords = result.storedKeywords || [];
    optimizeKeywords();
  });
}

function optimizeKeywords() {
  // Example optimization: remove substrings that are already matched by other keywords
  regexKeywords = regexKeywords.filter((regex, index, arr) => {
    return !arr.some((r, i) => i !== index && r.includes(regex));
  });
}
