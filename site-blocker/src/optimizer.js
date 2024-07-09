self.addEventListener("message", (e) => {
  const keywords = e.data;
  const optimizedKeywords = deduplicateKeywords(keywords);
  self.postMessage(optimizedKeywords);
});

function deduplicateKeywords(keywords) {
  keywords.sort((a, b) => a.length - b.length);

  const uniqueKeywords = [];
  const keywordSet = new Set();

  for (let keyword of keywords) {
    let isRedundant = false;
    for (let existing of keywordSet) {
      if (existing.includes(keyword)) {
        isRedundant = true;
        break;
      }
    }
    if (!isRedundant) {
      uniqueKeywords.push(keyword);
      keywordSet.add(keyword);
    }
  }

  return uniqueKeywords;
}
