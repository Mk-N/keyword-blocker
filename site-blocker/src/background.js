let blockedKeywords = [];
let blockingEnabled = true;
let creating; // A global promise to avoid concurrency issues

chrome.storage.local.get(["blockedKeywords"], (result) => {
  if (result.blockedKeywords) {
    blockedKeywords = result.blockedKeywords;
  }
});

function saveKeywords() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ blockedKeywords }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

function loadKeywords() {
  chrome.storage.local.get(["blockedKeywords"], (result) => {
    if (result.blockedKeywords) {
      blockedKeywords = result.blockedKeywords;
    }
  });
}

async function setupOffscreenDocument(path) {
  console.log("Setting up offscreen document for path:", path);
  const offscreenUrl = chrome.runtime.getURL(path);

  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl],
    });

    console.log("Existing contexts:", existingContexts);

    if (existingContexts.length > 0) {
      console.log("Offscreen document already exists.");
      return { success: true, path };
    }

    if (creating) {
      console.log(
        "Waiting for existing offscreen document creation process to complete."
      );
      await creating;
    } else {
      console.log("Creating new offscreen document.");
      creating = chrome.offscreen.createDocument({
        url: path,
        reasons: ["WORKERS"],
        justification: "needed for web worker support",
      });
      await creating;
      creating = null;
      console.log("Offscreen document created.");
    }
    return { success: true, path };
  } catch (error) {
    console.error("Error setting up offscreen document:", error);
    throw error;
  }
}

async function checkUrl(url) {
  await setupOffscreenDocument("src/offscreen.html");
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "checkUrl", url, blockedKeywords },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in checkUrl message:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log("URL checked:", response.keyword);
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
  console.log("Background script received message:", request.action, request);

  try {
    if (request.action === "getKeywords") {
      sendResponse(blockedKeywords);
    } else if (request.action === "addKeyword") {
      blockedKeywords.push(request.keyword);
      await saveKeywords();
      sendResponse(true);
    } else if (request.action === "removeKeyword") {
      blockedKeywords.splice(request.index, 1);
      await saveKeywords();
      sendResponse(true);
    } else if (request.action === "deleteAllKeywords") {
      blockedKeywords = [];
      await saveKeywords();
      sendResponse(true);
    } else if (request.action === "saveKeywords") {
      await saveKeywords();
      sendResponse(true);
    } else if (request.action === "setupOffscreenDocument") {
      (async () => {
        try {
          const result = await setupOffscreenDocument(request.path);
          console.log("setupOffscreenDocument result:", result);
          sendResponse({ success: result.success, path: result.path });
        } catch (error) {
          console.error("Error in setupOffscreenDocument:", error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // Indicate that the response will be sent asynchronously
    }
  } catch (error) {
    console.error("Error in background script:", error);
    sendResponse({ error: error.message });
  }

  // Return true to indicate you want to send a response asynchronously
  return true;
});
