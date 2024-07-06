import { getKeywords } from "./storage.js";
import { optimizeKeywords } from "./regexUtils.js";

let keywords = [];

chrome.runtime.onInstalled.addListener(() => {
  loadKeywords();
});

function loadKeywords() {
  getKeywords().then((loadedKeywords) => {
    keywords = optimizeKeywords(loadedKeywords);
    setupBlocking();
  });
}

function setupBlocking() {
  chrome.webRequest.onBeforeRequest.addListener(
    blockRequest,
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
}

function blockRequest(details) {
  const url = details.url;
  for (const keyword of keywords) {
    if (new RegExp(keyword).test(url)) {
      return {
        redirectUrl:
          chrome.runtime.getURL("src/blockPage.html") +
          "?keyword=" +
          encodeURIComponent(keyword),
      };
    }
  }
  return { cancel: false };
}
