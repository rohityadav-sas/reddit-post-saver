chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "saveRedditPost",
		title: "Save Reddit Post",
		contexts: ["page"],
		documentUrlPatterns: ["*://*.reddit.com/r/*/comments/*"],
	})
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "saveRedditPost") {
		chrome.tabs.sendMessage(tab.id, { action: "savePost" }, (response) => {
			if (chrome.runtime.lastError) {
				console.error("Error sending message to tab:", chrome.runtime.lastError)
				return
			}
			
			if (response && response.success) {
				console.log("Post saved successfully from context menu")
			} else {
				console.error("Failed to save post from context menu:", response?.error)
			}
		})
	}
})
