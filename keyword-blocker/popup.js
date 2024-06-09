// popup.js
document.addEventListener('DOMContentLoaded', () => {
	const textarea = document.getElementById('keywords');
	const saveButton = document.getElementById('save');

	// Load keywords from the file
	fetch(chrome.runtime.getURL('keywords.txt'))
		.then(response => response.text())
		.then(text => {
			textarea.value = text;
		});

	// Save keywords
	saveButton.addEventListener('click', () => {
		const keywords = textarea.value.trim();
		alert('Keywords saved locally! Note: Changes to keywords.txt must be done manually.');
	});
});