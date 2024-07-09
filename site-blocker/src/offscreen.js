chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkUrl") {
    const worker = new Worker(chrome.runtime.getURL("matcher.js"));
    worker.postMessage({
      url: request.url,
      blockedKeywords: request.blockedKeywords,
    });
    worker.onmessage = (e) => {
      sendResponse({ keyword: e.data });
      worker.terminate();
    };
    return true; // Indicates that the response is sent asynchronously.
  } else if (request.action === "optimizeKeywords") {
    const worker = new Worker(chrome.runtime.getURL("optimizer.js"));
    worker.postMessage(request.keywords);
    worker.onmessage = (e) => {
      sendResponse({ optimizedKeywords: e.data });
      worker.terminate();
    };
    return true; // Indicates that the response is sent asynchronously.
  }
});
