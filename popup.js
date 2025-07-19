class RedditSavePopup {
	constructor() {
		this.currentPostData = null
		this.init()
	}

	async init() {
		this.setupTabs()
		this.setupEventListeners()
		await this.checkCurrentTab()
		await this.loadSavedPosts()
	}

	setupTabs() {
		const tabs = document.querySelectorAll(".tab")
		const tabContents = document.querySelectorAll(".tab-content")

		tabs.forEach((tab) => {
			tab.addEventListener("click", () => {
				tabs.forEach((t) => t.classList.remove("active"))
				tabContents.forEach((tc) => tc.classList.remove("active"))

				tab.classList.add("active")
				const targetTab = tab.dataset.tab
				document.getElementById(`${targetTab}-tab`).classList.add("active")

				if (targetTab === "saved") {
					this.loadSavedPosts()
				}
			})
		})
	}

	setupEventListeners() {
		document.getElementById("save-btn").addEventListener("click", () => {
			this.saveCurrentPost()
		})
	}

	async checkCurrentTab() {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			})

			if (this.isRedditPost(tab.url)) {
				chrome.tabs.sendMessage(
					tab.id,
					{ action: "getPostData" },
					(response) => {
						if (response && response.success) {
							this.displayCurrentPost(response.data)
						} else {
							this.showNotRedditPost()
						}
					}
				)
			} else {
				this.showNotRedditPost()
			}
		} catch (error) {
			console.error("Error checking current tab:", error)
			this.showNotRedditPost()
		}
	}

	isRedditPost(url) {
		return url && url.includes("reddit.com/r/") && url.includes("/comments/")
	}

	displayCurrentPost(postData) {
		this.currentPostData = postData

		document.getElementById("post-title").textContent = postData.title
		document.getElementById("post-meta").innerHTML = `
            <span>👍 ${postData.score}</span>
            <span>💬 ${postData.commentCount}</span>
            <span>📍 ${postData.subreddit}</span>
        `

		document.getElementById("current-post").style.display = "block"
		document.getElementById("save-btn").disabled = false
		document.getElementById("btn-text").innerHTML = "💾 Save This Post"
	}

	showNotRedditPost() {
		document.getElementById("current-post").style.display = "none"
		document.getElementById("save-btn").disabled = true
		document.getElementById("btn-text").innerHTML = "❌ Not a Reddit Post"
	}

	async saveCurrentPost() {
		if (!this.currentPostData) return

		try {
			this.showStatus("Saving post...", "loading")
			document.getElementById("save-btn").disabled = true

			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			})

			chrome.tabs.sendMessage(
				tab.id,
				{ action: "getCommentsData" },
				async (response) => {
					if (response && response.success) {
						const apiPostData = response.additionalPostData || {}

						const saveData = {
							id: this.currentPostData.id,
							title: this.currentPostData.title,
							subreddit: this.currentPostData.subreddit,
							author: this.currentPostData.author,
							score: this.currentPostData.score,
							url: this.currentPostData.url,
							selftext:
								apiPostData.selftext || this.currentPostData.selftext || "",
							imageUrl:
								apiPostData.imageUrl || this.currentPostData.imageUrl || "",
							savedAt: new Date().toISOString(),
							commentCount: response.data.length,
							comments: response.data,
						}

						await this.saveToStorage(saveData)
						this.showStatus("✅ Post saved successfully!", "success")

						setTimeout(() => {
							document.getElementById("save-btn").disabled = false
							document.getElementById("btn-text").innerHTML =
								"💾 Save This Post"
							this.clearStatus()
						}, 2000)
					} else {
						this.showStatus("❌ Failed to fetch comments", "error")
						document.getElementById("save-btn").disabled = false
					}
				}
			)
		} catch (error) {
			console.error("Error saving post:", error)
			this.showStatus("❌ Error saving post", "error")
			document.getElementById("save-btn").disabled = false
		}
	}

	async saveToStorage(postData) {
		try {
			const result = await chrome.storage.local.get("savedPosts")
			const savedPosts = result.savedPosts || {}

			savedPosts[postData.id] = postData

			await chrome.storage.local.set({ savedPosts })
		} catch (error) {
			console.error("Error saving to storage:", error)
			throw error
		}
	}

	async loadSavedPosts() {
		try {
			const result = await chrome.storage.local.get("savedPosts")
			const savedPosts = result.savedPosts || {}

			const container = document.getElementById("saved-posts-container")

			if (Object.keys(savedPosts).length === 0) {
				container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📚</div>
                        <p>No saved posts yet</p>
                        <p style="font-size: 0.8rem; margin-top: 5px;">Go to a Reddit post and click save!</p>
                    </div>
                `
				return
			}

			const postsArray = Object.values(savedPosts).sort(
				(a, b) => new Date(b.savedAt) - new Date(a.savedAt)
			)

			container.innerHTML = postsArray
				.map(
					(post) => `
                <div class="saved-post" data-post-id="${post.id}">
                    <div class="saved-post-title">${post.title}</div>
                    <div class="saved-post-meta">
                        <div>
                            <span class="comment-count">${
															post.commentCount
														} comments</span>
                            <span style="margin-left: 10px;">📍 ${
															post.subreddit
														}</span>
                        </div>
                        <div>
                            <span>${this.getTimeAgo(post.savedAt)}</span>
                            <button class="delete-btn" data-post-id="${
															post.id
														}">🗑️</button>
                        </div>
                    </div>
                </div>
            `
				)
				.join("")

			container.querySelectorAll(".saved-post").forEach((postEl) => {
				postEl.addEventListener("click", (e) => {
					if (!e.target.classList.contains("delete-btn")) {
						const postId = postEl.dataset.postId
						this.viewSavedPost(postId)
					}
				})
			})

			container.querySelectorAll(".delete-btn").forEach((deleteBtn) => {
				deleteBtn.addEventListener("click", (e) => {
					e.stopPropagation()
					const postId = deleteBtn.dataset.postId
					this.deleteSavedPost(postId)
				})
			})
		} catch (error) {
			console.error("Error loading saved posts:", error)
		}
	}

	async deleteSavedPost(postId) {
		try {
			const result = await chrome.storage.local.get("savedPosts")
			const savedPosts = result.savedPosts || {}

			delete savedPosts[postId]

			await chrome.storage.local.set({ savedPosts })
			await this.loadSavedPosts()
		} catch (error) {
			console.error("Error deleting post:", error)
		}
	}

	viewSavedPost(postId) {
		chrome.tabs.create({
			url: chrome.runtime.getURL(`viewer.html?postId=${postId}`),
		})
	}

	getTimeAgo(timestamp) {
		const now = new Date()
		const saved = new Date(timestamp)
		const diffMs = now - saved
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMs / 3600000)
		const diffDays = Math.floor(diffMs / 86400000)

		if (diffMins < 60) return `${diffMins}m ago`
		if (diffHours < 24) return `${diffHours}h ago`
		return `${diffDays}d ago`
	}

	showStatus(message, type) {
		const statusEl = document.getElementById("status-message")
		statusEl.innerHTML = message
		statusEl.className = `status-message status-${type}`
		statusEl.style.display = "block"
	}

	clearStatus() {
		const statusEl = document.getElementById("status-message")
		statusEl.style.display = "none"
		statusEl.innerHTML = ""
		statusEl.className = "status-message"
	}
}

document.addEventListener("DOMContentLoaded", () => {
	new RedditSavePopup()
})
