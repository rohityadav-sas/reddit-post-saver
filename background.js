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
		chrome.tabs.sendMessage(tab.id, { action: "savePost" })
	}
})
