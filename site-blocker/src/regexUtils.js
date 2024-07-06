export function optimizeKeywords(keywords) {
  // Remove redundant keywords and optimize the list.
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
