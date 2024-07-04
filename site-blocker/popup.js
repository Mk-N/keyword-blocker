document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("save-keywords");
  const keywordsArea = document.getElementById("keywords");
  const fileInput = document.getElementById("file-input");

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

  // Handle file input
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const contents = e.target.result;
        const newKeywords = contents.split("\n").filter(Boolean);
        const currentKeywords = keywordsArea.value.split("\n").filter(Boolean);
        const allKeywords = [...new Set([...currentKeywords, ...newKeywords])];
        keywordsArea.value = allKeywords.join("\n");
      };
      reader.readAsText(file);
    }
  });
});
