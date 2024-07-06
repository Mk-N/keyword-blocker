chrome.runtime.onInstalled.addListener(() => {
  loadKeywords();
});

chrome.runtime.onStartup.addListener(() => {
  loadKeywords();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateKeywords") {
    chrome.storage.local.set({ storedKeywords: message.keywords }, () => {
      sendResponse({ status: "updated" });
    });
  }
});

function loadKeywords() {
  chrome.storage.local.get(["storedKeywords"], (result) => {
    const keywords = result.storedKeywords || [];
    console.log("Keywords loaded:", keywords); // Log to verify keywords loading
  });
}
