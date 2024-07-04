document.getElementById("save-keywords").addEventListener("click", () => {
  const newKeywords = document
    .getElementById("keywords")
    .value.split("\n")
    .filter(Boolean);
  chrome.storage.local.get(["storedKeywords"], (result) => {
    const storedKeywords = result.storedKeywords || [];
    const allKeywords = [...new Set([...storedKeywords, ...newKeywords])];
    chrome.storage.local.set({ storedKeywords: allKeywords }, () => {
      alert("Keywords saved!");
    });
  });
});

chrome.storage.local.get(["storedKeywords"], (result) => {
  const storedKeywords = result.storedKeywords || [];
  document.getElementById("keywords").value = storedKeywords.join("\n");
});
