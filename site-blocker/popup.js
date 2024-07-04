document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("save-keywords");
  const keywordsArea = document.getElementById("keywords");

  // Load stored keywords when the popup is opened
  chrome.storage.local.get(["storedKeywords"], function (result) {
    const storedKeywords = result.storedKeywords || [];
    keywordsArea.value = storedKeywords.join("\n");
  });

  // Save new keywords when the save button is clicked
  saveButton.addEventListener("click", function () {
    const newKeywords = keywordsArea.value.split("\n").filter(Boolean);
    chrome.storage.local.set({ storedKeywords: newKeywords }, function () {
      alert("Keywords saved!");
      updateBackgroundKeywords();
    });
  });

  // Update background script with new keywords
  function updateBackgroundKeywords() {
    chrome.storage.local.get(["storedKeywords"], function (result) {
      chrome.runtime.sendMessage({
        action: "updateKeywords",
        keywords: result.storedKeywords,
      });
    });
  }
});
