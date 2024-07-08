chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "block") {
    displayBlockMessage(request.keyword);
  }
});

function displayBlockMessage(keyword) {
  document.body.innerHTML = `<h1>This URL has been blocked by: ${keyword}</h1>`;
}
