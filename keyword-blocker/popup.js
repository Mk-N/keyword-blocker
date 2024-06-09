// popup.js
document.addEventListener('DOMContentLoaded', () => {
	const textarea = document.getElementById('keywords');
	const saveButton = document.getElementById('save');
	const notificationToggle = document.getElementById('notificationToggle');

	// Load keywords from the file
	fetch(chrome.runtime.getURL('keywords.txt'))
		.then(response => response.text())
		.then(text => {
			textarea.value = text;
		});

	// Load notification toggle state
	chrome.storage.local.get('notificationEnabled', result => {
		notificationToggle.checked = result.notificationEnabled;
	});

	// Save keywords and notification toggle state
	saveButton.addEventListener('click', () => {
		const keywords = textarea.value.trim();
		const notificationEnabled = notificationToggle.checked;
		chrome.storage.local.set({ keywords, notificationEnabled }, () => {
			alert('Keywords and notification toggle saved locally! Note: Changes to keywords.txt must be done manually.');
		});
	});
});