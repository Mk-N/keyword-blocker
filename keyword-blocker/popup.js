// popup.js
document.addEventListener('DOMContentLoaded', () => {
	const textarea = document.getElementById('keywords');
	const saveButton = document.getElementById('save');
	const resetButton = document.getElementById('reset');
	const notificationToggle = document.getElementById('notificationToggle');

	// Load keywords and notification state from local storage
	chrome.storage.local.get(['keywords', 'notificationEnabled'], result => {
		textarea.value = result.keywords || '';
		notificationToggle.checked = result.notificationEnabled || false;
	});

	// Save keywords and notification toggle state
	saveButton.addEventListener('click', () => {
		const keywords = textarea.value.trim();
		const notificationEnabled = notificationToggle.checked;
		chrome.storage.local.set({ keywords, notificationEnabled }, () => {
			alert('Keywords and notification toggle saved locally!');
		});
	});

	// Reset keywords and notification toggle state to default
	resetButton.addEventListener('click', () => {
		textarea.value = '';
		notificationToggle.checked = false;
		chrome.storage.local.remove(['keywords', 'notificationEnabled'], () => {
			alert('Keywords and notification toggle reset to default!');
		});
	});
});