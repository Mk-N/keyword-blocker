document.addEventListener("DOMContentLoaded", () => {
  const keywordInput = document.getElementById("keyword-input");
  const addKeywordBtn = document.getElementById("add-keyword-btn");
  const fileInput = document.getElementById("file-input");
  const optimizeInput = document.getElementById("optimize-input");
  const deleteAllBtn = document.getElementById("delete-all-btn");
  const saveKeywordsBtn = document.getElementById("save-keywords-btn");
  const keywordsList = document.getElementById("keywords-list");
  let blockedKeywords = [];

  // Load keywords from storage
  chrome.storage.local.get(["blockedKeywords"], (result) => {
    blockedKeywords = result.blockedKeywords || [];
    keywordsList.innerHTML = "";
    blockedKeywords.forEach((keyword) => {
      addKeywordToList(keyword);
    });
  });

  // Add keyword
  addKeywordBtn.addEventListener("click", () => {
    const keyword = keywordInput.value.trim();
    if (keyword && !blockedKeywords.includes(keyword)) {
      blockedKeywords.push(keyword);
      addKeywordToList(keyword);
      saveKeywords();
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
      saveKeywords();
    });
  }

  // Save keywords
  function saveKeywords() {
    chrome.storage.local.set({ blockedKeywords });
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
            saveKeywords();
          });
        } else {
          keywords.forEach((keyword) => addKeyword(keyword));
          saveKeywords();
        }
      };
      reader.readAsText(file);
    }
  });

  // Optimize keywords
  async function optimizeKeywords(keywords) {
    await ensureOffscreenDocument();
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "optimizeKeywords", keywords },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response.optimizedKeywords);
          }
        }
      );
    });
  }

  // Ensure offscreen document exists
  async function ensureOffscreenDocument() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "setupOffscreenDocument", path: "src/offscreen.html" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Delete all keywords
  deleteAllBtn.addEventListener("click", () => {
    blockedKeywords = [];
    saveKeywords();
    keywordsList.innerHTML = "";
  });

  // Save all keywords on button click
  saveKeywordsBtn.addEventListener("click", () => {
    saveKeywords();
    alert("Keywords saved successfully!");
  });

  // Ensure save operations complete before popup closes
  window.addEventListener("beforeunload", saveKeywords);
});
