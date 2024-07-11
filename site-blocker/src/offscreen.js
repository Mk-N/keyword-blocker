console.log("Offscreen document loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Offscreen document received message:", request.action);
  if (request.action === "checkUrl") {
    const worker = new Worker(chrome.runtime.getURL("src/matcher.js"));
    worker.postMessage({
      url: request.url,
      blockedKeywords: request.blockedKeywords,
    });
    worker.onmessage = (e) => {
      console.log("Worker completed URL check.");
      sendResponse({ keyword: e.data });
      worker.terminate();
    };
    return true; // Indicates that the response is sent asynchronously.
  } else if (request.action === "optimizeKeywords") {
    const worker = new Worker(chrome.runtime.getURL("src/optimizer.js"));
    worker.postMessage(request.keywords);
    worker.onmessage = (e) => {
      console.log("Worker completed keyword optimization.");
      sendResponse({ optimizedKeywords: e.data });
      worker.terminate();
    };
    return true; // Indicates that the response is sent asynchronously.
  }
});
