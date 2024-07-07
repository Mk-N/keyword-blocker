document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveBtn");
  const fileInput = document.getElementById("fileInput");
  const keywordInput = document.getElementById("keywordInput");
  const keywordList = document.getElementById("keywordList");

  // Load existing keywords from storage and display them
  chrome.storage.local.get("keywords", (result) => {
    const keywords = result.keywords || [];
    keywords.forEach(addKeywordToList);
  });

  // Save button event listener
  saveBtn.addEventListener("click", () => {
    const keywords = keywordInput.value
      .split("\n")
      .map((kw) => kw.trim())
      .filter((kw) => kw !== "");
    const validKeywords = [];
    const invalidKeywords = [];

    keywords.forEach((keyword) => {
      if (isValidRegex(keyword)) {
        validKeywords.push(keyword);
      } else {
        invalidKeywords.push(keyword);
      }
    });

    if (invalidKeywords.length > 0) {
      alert(`Invalid regex: ${invalidKeywords.join(", ")}`);
    }

    chrome.storage.local.get("keywords", (result) => {
      const existingKeywords = result.keywords || [];
      const updatedKeywords = optimizeKeywords([
        ...existingKeywords,
        ...validKeywords,
      ]);
      chrome.storage.local.set({ keywords: updatedKeywords }, () => {
        keywordList.innerHTML = "";
        updatedKeywords.forEach(addKeywordToList);
      });
    });

    keywordInput.value = "";
  });

  // File input event listener
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const keywords = e.target.result
          .split("\n")
          .map((kw) => kw.trim())
          .filter((kw) => kw !== "");
        const validKeywords = [];
        const invalidKeywords = [];

        keywords.forEach((keyword) => {
          if (isValidRegex(keyword)) {
            validKeywords.push(keyword);
          } else {
            invalidKeywords.push(keyword);
          }
        });

        if (invalidKeywords.length > 0) {
          alert(`Invalid regex: ${invalidKeywords.join(", ")}`);
        }

        chrome.storage.local.get("keywords", (result) => {
          const existingKeywords = result.keywords || [];
          const updatedKeywords = optimizeKeywords([
            ...existingKeywords,
            ...validKeywords,
          ]);
          chrome.storage.local.set({ keywords: updatedKeywords }, () => {
            keywordList.innerHTML = "";
            updatedKeywords.forEach(addKeywordToList);
          });
        });
      };
      reader.readAsText(file);
    }
  });

  // Add keyword to the list
  function addKeywordToList(keyword) {
    const li = document.createElement("li");
    li.textContent = keyword;
    keywordList.appendChild(li);
  }

  // Validate regex function
  function isValidRegex(str) {
    try {
      new RegExp(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Optimize keywords function
  function optimizeKeywords(keywords) {
    let optimized = [];
    for (let i = 0; i < keywords.length; i++) {
      let isRedundant = false;
      for (let j = 0; j < keywords.length; j++) {
        if (i !== j && keywords[j].includes(keywords[i])) {
          isRedundant = true;
          break;
        }
      }
      if (!isRedundant) {
        optimized.push(keywords[i]);
      }
    }
    return optimized;
  }
});
