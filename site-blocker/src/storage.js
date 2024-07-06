export function getKeywords() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["keywords"], (result) => {
      resolve(result.keywords || []);
    });
  });
}

export function setKeywords(keywords) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ keywords }, () => {
      resolve();
    });
  });
}
