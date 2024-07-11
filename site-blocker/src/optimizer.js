self.addEventListener("message", (e) => {
  const keywords = e.data;
  const optimizedKeywords = deduplicateKeywords(keywords);
  self.postMessage(optimizedKeywords);
});

function deduplicateKeywords(keywords) {
  // Remove duplicates and sort the keywords by length in ascending order
  keywords = Array.from(new Set(keywords)).sort((a, b) => a.length - b.length);

  const uniqueKeywords = [];

  for (let i = 0; i < keywords.length; i++) {
    let isRedundant = false;
    for (let j = 0; j < i; j++) {
      // Check if the current keyword includes any of the shorter keywords
      if (keywords[i].includes(keywords[j])) {
        isRedundant = true;
        break;
      }
    }
    // If the keyword includes any of the shorter keywords, it is redundant and not added to uniqueKeywords
    if (!isRedundant) {
      uniqueKeywords.push(keywords[i]);
    }
  }

  return uniqueKeywords;
}
