chrome.storage.local.get(["storedKeywords"], function (result) {
  const storedKeywords = result.storedKeywords || [];
  const currentUrl = window.location.href;

  const matchingKeywords = storedKeywords.filter((keyword) =>
    new RegExp(keyword, "i").test(currentUrl)
  );

  if (matchingKeywords.length > 0) {
    const redirectUrl = chrome.runtime.getURL(
      `blocked.html?keywords=${encodeURIComponent(
        JSON.stringify(matchingKeywords)
      )}`
    );
    window.location.replace(redirectUrl);
  }
});
