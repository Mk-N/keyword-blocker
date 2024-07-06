document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const keywords = JSON.parse(decodeURIComponent(urlParams.get("keywords")));

  const keywordsDiv = document.getElementById("keywords");
  keywords.forEach((keyword) => {
    const p = document.createElement("p");
    p.textContent = keyword;
    keywordsDiv.appendChild(p);
  });
});
