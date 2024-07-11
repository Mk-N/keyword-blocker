let blockedKeywords = [];
let blockingEnabled = true;
let creating; // A global promise to avoid concurrency issues

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

async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ["WORKERS"],
      justification: "needed for web worker support",
    });
    await creating;
    creating = null;
  }
}

async function ensureOffscreenDocument() {
  await setupOffscreenDocument("src/offscreen.html");
}

async function checkUrl(url) {
  await ensureOffscreenDocument();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "checkUrl", url, blockedKeywords },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response.keyword);
        }
      }
    );
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (!blockingEnabled) return;
    checkUrl(details.url)
      .then((keyword) => {
        if (keyword) {
          chrome.tabs.update(details.tabId, {
            url: `src/blocked.html?keyword=${encodeURIComponent(keyword)}`,
          });
        }
      })
      .catch((error) => {
        console.error("Error checking URL:", error);
      });
  },
  { url: [{ urlMatches: ".*" }] }
);

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
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
  } else if (request.action === "setupOffscreenDocument") {
    await setupOffscreenDocument(request.path);
    sendResponse(true);
  }
});
