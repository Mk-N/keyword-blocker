import { getKeywords, setKeywords } from "../storage.js";
import { optimizeKeywords } from "../regexUtils.js";

document.addEventListener("DOMContentLoaded", () => {
  const keywordInput = document.getElementById("keywordInput");
  const fileInput = document.getElementById("fileInput");
  const saveBtn = document.getElementById("saveBtn");
  const keywordList = document.getElementById("keywordList");

  saveBtn.addEventListener("click", saveKeywords);
  fileInput.addEventListener("change", handleFileUpload);
  window.addEventListener("resize", adjustPopupSize);

  loadKeywords();
  adjustPopupSize(); // Adjust size on load

  function loadKeywords() {
    getKeywords().then((keywords) => {
      displayKeywords(keywords);
    });
  }

  function saveKeywords() {
    const keywords = keywordInput.value.split("\n").filter(Boolean);
    setKeywords(optimizeKeywords(keywords)).then(() => {
      loadKeywords();
    });
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const keywords = e.target.result.split("\n").filter(Boolean);
        setKeywords(optimizeKeywords(keywords)).then(() => {
          loadKeywords();
        });
      };
      reader.readAsText(file);
    }
  }

  function displayKeywords(keywords) {
    keywordList.innerHTML = "";
    keywords.forEach((keyword, index) => {
      const li = document.createElement("li");
      li.textContent = keyword;
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => removeKeyword(index));
      li.appendChild(deleteBtn);
      keywordList.appendChild(li);
    });
  }

  function removeKeyword(index) {
    getKeywords().then((keywords) => {
      keywords.splice(index, 1);
      setKeywords(keywords).then(() => {
        loadKeywords();
      });
    });
  }

  function adjustPopupSize() {
    if (window.innerHeight > window.innerWidth) {
      document.body.style.width = "300px";
      document.body.style.height = "500px";
    } else {
      document.body.style.width = "500px";
      document.body.style.height = "300px";
    }
  }
});
