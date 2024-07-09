document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const keyword = urlParams.get("keyword");
  document.querySelector("h1").innerText += keyword;
});
