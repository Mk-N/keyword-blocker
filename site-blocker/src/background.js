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
    console.log("Checking if offscreen document exists...");
    chrome.runtime.sendMessage({ action: "checkOffscreen" }, (response) => {
      if (response && response.exists) {
        console.log("Offscreen document exists.");
        resolve();
      } else {
        console.log("Creating offscreen document...");
        chrome.offscreen.createDocument(
          {
            url: chrome.runtime.getURL("src/offscreen.html"),
            reasons: ["WORKERS"],
            justification: "needed for web worker support",
          },
          () => {
            console.log("Offscreen document created.");
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
  console.log("Background script received message:", request.action);
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
