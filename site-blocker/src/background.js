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

function ensureOffscreenDocument() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "checkOffscreen" }, (response) => {
      if (response && response.exists) {
        resolve();
      } else {
        chrome.offscreen.createDocument(
          {
            url: chrome.runtime.getURL("src/offscreen.html"),
            reasons: ["WORKERS"],
            justification: "needed for web worker support",
          },
          () => {
            resolve();
          }
        );
      }
    });
  });
}

function checkUrl(url) {
  return new Promise((resolve) => {
    ensureOffscreenDocument().then(() => {
      chrome.runtime.sendMessage(
        { action: "checkUrl", url, blockedKeywords },
        (response) => {
          resolve(response.keyword);
        }
      );
    });
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (!blockingEnabled) return;
    checkUrl(details.url).then((keyword) => {
      if (keyword) {
        chrome.tabs.update(details.tabId, {
          url: `src/blocked.html?keyword=${encodeURIComponent(keyword)}`,
        });
      }
    });
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
  } else if (request.action === "saveKeywords") {
    saveKeywords();
    sendResponse(true);
  } else if (request.action === "checkOffscreen") {
    // This is just to avoid an error if this action is received here
    sendResponse({ exists: false });
  }
});
