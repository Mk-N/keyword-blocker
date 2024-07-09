document.addEventListener("DOMContentLoaded", () => {
  const keywordInput = document.getElementById("keyword-input");
  const addKeywordBtn = document.getElementById("add-keyword-btn");
  const fileInput = document.getElementById("file-input");
  const optimizeInput = document.getElementById("optimize-input");
  const deleteAllBtn = document.getElementById("delete-all-btn");
  const keywordsList = document.getElementById("keywords-list");

  // Load keywords from storage
  chrome.storage.local.get(["blockedKeywords"], (result) => {
    const blockedKeywords = result.blockedKeywords || [];
    keywordsList.innerHTML = "";
    blockedKeywords.forEach((keyword) => {
      addKeywordToList(keyword);
    });
  });

  // Add keyword
  addKeywordBtn.addEventListener("click", () => {
    const keyword = keywordInput.value.trim();
    if (keyword) {
      addKeyword(keyword);
      keywordInput.value = "";
    }
  });

  // Add keyword to list
  function addKeywordToList(keyword) {
    const keywordItem = document.createElement("div");
    keywordItem.className = "keyword-item";
    keywordItem.textContent = keyword;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      removeKeyword(keyword);
      keywordsList.removeChild(keywordItem);
    });
    keywordItem.appendChild(removeBtn);
    keywordsList.appendChild(keywordItem);
  }

  // Remove keyword
  function removeKeyword(keyword) {
    chrome.storage.local.get(["blockedKeywords"], (result) => {
      let blockedKeywords = result.blockedKeywords || [];
      blockedKeywords = blockedKeywords.filter((kw) => kw !== keyword);
      chrome.storage.local.set({ blockedKeywords });
    });
  }

  // Add keyword
  function addKeyword(keyword) {
    chrome.storage.local.get(["blockedKeywords"], (result) => {
      const blockedKeywords = result.blockedKeywords || [];
      if (!blockedKeywords.includes(keyword)) {
        blockedKeywords.push(keyword);
        chrome.storage.local.set({ blockedKeywords }, () => {
          addKeywordToList(keyword);
        });
      }
    });
  }

  // Handle file input
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const keywords = e.target.result
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);
        if (optimizeInput.checked) {
          optimizeKeywords(keywords).then((optimizedKeywords) => {
            optimizedKeywords.forEach((keyword) => addKeyword(keyword));
          });
        } else {
          keywords.forEach((keyword) => addKeyword(keyword));
        }
      };
      reader.readAsText(file);
    }
  });

  // Optimize keywords
  function optimizeKeywords(keywords) {
    return new Promise((resolve) => {
      const worker = new Worker("optimize-worker.js");
      worker.postMessage(keywords);
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
    });
  }

  // Delete all keywords
  deleteAllBtn.addEventListener("click", () => {
    chrome.storage.local.set({ blockedKeywords: [] }, () => {
      keywordsList.innerHTML = "";
    });
  });
});
