let blockedKeywords = [];
let blockingEnabled = true;

chrome.storage.local.get(["blockedKeywords"], (result) => {
  if (result.blockedKeywords) {
    blockedKeywords = result.blockedKeywords;
  }
});

function saveKeywords() {
  chrome.storage.local.set({ blockedKeywords });
}

function loadKeywords() {
  chrome.storage.local.get(["blockedKeywords"], (result) => {
    if (result.blockedKeywords) {
      blockedKeywords = result.blockedKeywords;
    }
  });
}

function checkUrl(url) {
  for (let keyword of blockedKeywords) {
    let regex = new RegExp(keyword, "i");
    if (regex.test(url)) {
      return keyword;
    }
  }
  return null;
}

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (!blockingEnabled) return;
    let keyword = checkUrl(details.url);
    if (keyword) {
      chrome.tabs.update(details.tabId, {
        url: `blocked.html?keyword=${encodeURIComponent(keyword)}`,
      });
    }
  },
  { url: [{ urlMatches: ".*" }] }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getKeywords") {
    sendResponse(blockedKeywords);
  } else if (request.action === "addKeyword") {
    blockedKeywords.push(request.keyword);
    saveKeywords();
    sendResponse(true);
  } else if (request.action === "removeKeyword") {
    blockedKeywords.splice(request.index, 1);
    saveKeywords();
    sendResponse(true);
  } else if (request.action === "deleteAllKeywords") {
    blockedKeywords = [];
    saveKeywords();
    sendResponse(true);
  }
});
