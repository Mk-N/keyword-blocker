document.addEventListener("DOMContentLoaded", initializePopup);

let keywordInput = document.getElementById("keyword-input");
let keywordList = document.getElementById("keyword-list");
let fileInput = document.getElementById("file-input");

function initializePopup() {
  loadKeywords();
  document
    .getElementById("add-keyword-btn")
    .addEventListener("click", addKeyword);
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", deleteAllKeywords);
  fileInput.addEventListener("change", uploadKeywords);
}

function addKeyword() {
  let keyword = keywordInput.value.trim();
  if (keyword) {
    chrome.runtime.sendMessage(
      { action: "addKeyword", keyword },
      (response) => {
        if (response) {
          loadKeywords();
          keywordInput.value = "";
        }
      }
    );
  }
}

function removeKeyword(index) {
  chrome.runtime.sendMessage({ action: "removeKeyword", index }, (response) => {
    if (response) {
      loadKeywords();
    }
  });
}

function loadKeywords() {
  chrome.runtime.sendMessage({ action: "getKeywords" }, (keywords) => {
    keywordList.innerHTML = "";
    keywords.forEach((keyword, index) => {
      let listItem = document.createElement("li");
      listItem.textContent = keyword;
      let removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => removeKeyword(index));
      listItem.appendChild(removeBtn);
      keywordList.appendChild(listItem);
    });
  });
}

function saveKeywords() {
  chrome.runtime.sendMessage({ action: "saveKeywords" });
}

function uploadKeywords(event) {
  let file = event.target.files[0];
  if (file) {
    let reader = new FileReader();
    reader.onload = (e) => {
      let keywords = e.target.result
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      keywords.forEach((keyword) => {
        chrome.runtime.sendMessage(
          { action: "addKeyword", keyword },
          (response) => {
            if (response) {
              loadKeywords();
            }
          }
        );
      });
    };
    reader.readAsText(file);
  }
}

function deleteAllKeywords() {
  chrome.runtime.sendMessage({ action: "deleteAllKeywords" }, (response) => {
    if (response) {
      loadKeywords();
    }
  });
}
