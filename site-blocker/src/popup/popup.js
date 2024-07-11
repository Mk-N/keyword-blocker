console.log("popup.js is loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const keywordInput = document.getElementById("keyword-input");
  const addKeywordBtn = document.getElementById("add-keyword-btn");
  const fileInput = document.getElementById("file-input");
  const optimizeInput = document.getElementById("optimize-input");
  const deleteAllBtn = document.getElementById("delete-all-btn");
  const saveKeywordsBtn = document.getElementById("save-keywords-btn");
  const keywordsList = document.getElementById("keywords-list");
  let blockedKeywords = [];
  let saveTimeout;

  // Load keywords from storage
  chrome.storage.local.get(["blockedKeywords"], (result) => {
    blockedKeywords = result.blockedKeywords || [];
    keywordsList.innerHTML = "";
    blockedKeywords.forEach((keyword) => {
      addKeywordToList(keyword);
    });
    console.log("Loaded blocked keywords:", blockedKeywords);
  });

  // Debounced save function
  function debounceSaveKeywords() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      chrome.storage.local.set({ blockedKeywords }, () => {
        console.log("Blocked keywords saved:", blockedKeywords);
      });
    }, 300);
  }

  // Add keyword
  addKeywordBtn.addEventListener("click", () => {
    const keyword = keywordInput.value.trim();
    if (keyword && !blockedKeywords.includes(keyword)) {
      blockedKeywords.push(keyword);
      addKeywordToList(keyword);
      debounceSaveKeywords();
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
    console.log("Added keyword to list:", keyword);
  }

  // Remove keyword
  function removeKeyword(keyword) {
    chrome.storage.local.get(["blockedKeywords"], (result) => {
      let blockedKeywords = result.blockedKeywords || [];
      blockedKeywords = blockedKeywords.filter((kw) => kw !== keyword);
      debounceSaveKeywords();
      console.log("Removed keyword:", keyword);
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
          .filter((line) => line && !blockedKeywords.includes(line));
        if (optimizeInput.checked) {
          optimizeKeywords(keywords)
            .then((optimizedKeywords) => {
              optimizedKeywords.forEach((keyword) => addKeywordToList(keyword));
              blockedKeywords.push(...optimizedKeywords);
            })
            .catch((error) => {
              console.error("Error optimizing keywords:", error);
            });
        } else {
          keywords.forEach((keyword) => addKeywordToList(keyword));
          blockedKeywords.push(...keywords);
        }
        debounceSaveKeywords();
        console.log("Loaded keywords from file:", keywords);
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
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.optimizedKeywords) {
            resolve(response.optimizedKeywords);
          } else {
            reject(new Error("Failed to optimize keywords"));
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
            reject(new Error(chrome.runtime.lastError.message));
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
    chrome.storage.local.set({ blockedKeywords }, () => {
      keywordsList.innerHTML = "";
    });
  });

  // Save all keywords on button click
  saveKeywordsBtn.addEventListener("click", () => {
    debounceSaveKeywords();
    alert("Keywords saved successfully!");
  });

  // Ensure save operations complete before popup closes
  window.addEventListener("beforeunload", () => {
    debounceSaveKeywords();
  });
});
