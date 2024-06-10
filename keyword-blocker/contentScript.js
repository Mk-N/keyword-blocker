// Retrieve the blocked keyword from local storage
chrome.storage.local.get('blockedKeyword', (result) => {
	const blockedKeyword = result.blockedKeyword;
	if (blockedKeyword) {
		const blockingMessage = `This site has been blocked by the extension due to the keyword: ${blockedKeyword}`;
		// Insert a message onto the blocked page
		const blockedMessageElement = document.createElement('div');
		blockedMessageElement.style.cssText = `
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					background-color: #f44336;
					color: white;
					font-size: 18px;
					font-weight: bold;
					padding: 10px;
					z-index: 9999;
					text-align: center;
			`;
		blockedMessageElement.textContent = blockingMessage;
		document.body.appendChild(blockedMessageElement);
	}
});