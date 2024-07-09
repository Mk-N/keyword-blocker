self.addEventListener("message", (e) => {
  const { url, blockedKeywords } = e.data;
  const keyword = matchUrl(url, blockedKeywords);
  self.postMessage(keyword);
});

function matchUrl(url, keywords) {
  for (let keyword of keywords) {
    let regex = new RegExp(keyword, "i");
    if (regex.test(url)) {
      return keyword;
    }
  }
  return null;
}
