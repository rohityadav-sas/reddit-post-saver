class RedditExtractor {
	constructor() {
		this.setupMessageListener()
	}

	setupMessageListener() {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.action === "getPostData") {
				this.extractPostData()
					.then((postData) => {
						sendResponse({ success: true, data: postData })
					})
					.catch((error) => {
						console.error("Error getting post data:", error)
						sendResponse({ success: false, error: error.message })
					})
				return true 
			} else if (request.action === "getCommentsData") {
				this.extractCommentsData()
					.then((commentsData) => {
						sendResponse({
							success: true,
							data: commentsData,
							additionalPostData: window.redditApiPostData || {},
						})
					})
					.catch((error) => {
						console.error("Error getting comments data:", error)
						sendResponse({ success: false, error: error.message })
					})
				return true 
			} else if (request.action === "savePost") {
				this.savePostFromContextMenu()
					.then(() => {
						sendResponse({ success: true })
					})
					.catch((error) => {
						console.error("Error saving post:", error)
						sendResponse({ success: false, error: error.message })
					})
				return true 
			}
		})
	}

	async extractPostData() {
		try {
			let apiData = null
			const url = window.location.href
			const apiUrl = url.endsWith("/")
				? `${url.slice(0, -1)}.json`
				: `${url}.json`

			try {
				const response = await fetch(apiUrl)
				if (response.ok) {
					const jsonData = await response.json()
					if (
						jsonData &&
						jsonData.length > 0 &&
						jsonData[0].data &&
						jsonData[0].data.children[0]
					) {
						apiData = jsonData[0].data.children[0].data
					}
				}
			} catch (e) {
				console.warn("Could not fetch Reddit API data:", e)
			}

			const titleElement = document.querySelector(
				'[data-test-id="post-content"] h1, [slot="title"], h1[data-adclicklocation="title"]'
			)
			const title =
				apiData?.title ||
				(titleElement
					? titleElement.textContent.trim()
					: document.title.split(" : ")[0])

			const subredditMatch = url.match(/\/r\/([^\/]+)/)
			const subreddit =
				apiData?.subreddit_name_prefixed ||
				(subredditMatch ? `r/${subredditMatch[1]}` : "r/unknown")

			const postIdMatch = url.match(/\/comments\/([^\/]+)/)
			const postId =
				apiData?.id || (postIdMatch ? postIdMatch[1] : Date.now().toString())

			let score = apiData?.score || 0
			if (!score) {
				const scoreElements = document.querySelectorAll(
					'[aria-label*="upvote"], [id*="vote-arrows"] span, [data-testid*="upvote"]'
				)
				for (let elem of scoreElements) {
					const text = elem.textContent.trim()
					const num = parseInt(text.replace(/[^\d-]/g, ""))
					if (!isNaN(num) && num > score) {
						score = num
					}
				}
			}

			let author = apiData?.author || "unknown"
			if (author === "unknown") {
				const authorElement = document.querySelector(
					'[data-testid="author-link"], [data-click-id="user"], [href*="/user/"], a[href*="/u/"]'
				)
				if (authorElement) {
					author = authorElement.textContent.trim().replace(/^u\//, "")
				}
			}

			let selftext = apiData?.selftext || ""
			if (!selftext || selftext.trim() === "") {
				const selftextSelectors = [
					'[data-test-id="post-content"] [data-click-id="text"]',
					'[data-adclicklocation="post_body"]',
					".usertext-body .md",
					'[data-testid="post-content-text"]',
					'[data-click-id="text"] p',
					'div[data-testid="post-content-text"]',
				]

				for (let selector of selftextSelectors) {
					const element = document.querySelector(selector)
					if (element && element.textContent.trim()) {
						selftext = element.textContent.trim()
						break
					}
				}
			}

			let imageUrl = ""
			if (
				apiData?.url &&
				(apiData.url.includes("i.redd.it") ||
					apiData.url.includes("i.imgur.com") ||
					apiData.url.match(/\.(jpg|jpeg|png|gif)$/i))
			) {
				imageUrl = apiData.url
			} else if (apiData?.preview?.images?.[0]?.source?.url) {
				imageUrl = apiData.preview.images[0].source.url.replace(/&amp;/g, "&")
			} else {
				const imageSelectors = [
					'[data-test-id="post-content"] img[src*="i.redd.it"]',
					'[data-test-id="post-content"] img[src*="preview.redd.it"]',
					'img[alt*="Post image"]',
					'[data-click-id="media"] img',
					".media-element img",
					'img[src*="i.imgur.com"]',
				]

				for (let selector of imageSelectors) {
					const imgElement = document.querySelector(selector)
					if (
						imgElement &&
						imgElement.src &&
						!imgElement.src.includes("emoji") &&
						!imgElement.src.includes("icon")
					) {
						imageUrl = imgElement.src
						break
					}
				}
			}

			const commentElements = document.querySelectorAll(
				'[data-testid="comment"], .Comment, [id*="comment-"]'
			)
			const commentCount = commentElements.length

			return {
				id: postId,
				title: title,
				subreddit: subreddit,
				author: author,
				score: score,
				url: url,
				selftext: selftext,
				imageUrl: imageUrl,
				commentCount: commentCount,
			}
		} catch (error) {
			console.error("Error extracting post data:", error)
			return null
		}
	}

	async extractCommentsData() {
		try {
			const url = window.location.href
			const jsonUrl = url.endsWith("/")
				? `${url.slice(0, -1)}.json`
				: `${url}.json`

			try {
				const response = await fetch(jsonUrl)
				const data = await response.json()

				if (data && data.length >= 2) {
					const postApiData = data[0].data.children[0].data

					if (postApiData) {
						window.redditApiPostData = {
							selftext: postApiData.selftext || "",
							url: postApiData.url || "",
							imageUrl: this.extractImageFromApiData(postApiData),
						}
					}

					return this.processRedditApiComments(data[1].data.children)
				}
			} catch (apiError) {
				console.log(
					"API fetch failed, falling back to DOM extraction:",
					apiError
				)
			}

			return this.extractCommentsFromDOM()
		} catch (error) {
			console.error("Error extracting comments:", error)
			return []
		}
	}

	extractImageFromApiData(postData) {
		if (
			postData.url &&
			(postData.url.includes(".jpg") ||
				postData.url.includes(".png") ||
				postData.url.includes(".gif") ||
				postData.url.includes("i.redd.it"))
		) {
			return postData.url
		}

		if (
			postData.preview &&
			postData.preview.images &&
			postData.preview.images.length > 0
		) {
			const preview = postData.preview.images[0]
			if (preview.source && preview.source.url) {
				return preview.source.url.replace(/&amp;/g, "&")
			}
		}

		if (
			postData.thumbnail &&
			postData.thumbnail !== "self" &&
			postData.thumbnail !== "default"
		) {
			return postData.thumbnail
		}

		return ""
	}

	processRedditApiComments(apiComments) {
		const comments = []

		const processComment = (comment, depth = 0) => {
			if (
				!comment.data ||
				!comment.data.body ||
				comment.data.body === "[deleted]"
			) {
				return
			}

			const commentData = {
				id: comment.data.id,
				author: comment.data.author,
				body: comment.data.body,
				score: comment.data.score,
				depth: depth,
				timeAgo: this.getTimeAgo(comment.data.created_utc),
				createdUtc: comment.data.created_utc,
			}

			comments.push(commentData)

			if (
				comment.data.replies &&
				comment.data.replies.data &&
				comment.data.replies.data.children
			) {
				comment.data.replies.data.children.forEach((reply) => {
					if (reply.data && reply.data.body) {
						processComment(reply, depth + 1)
					}
				})
			}
		}

		apiComments.forEach((comment) => {
			if (comment.data && comment.data.body) {
				processComment(comment, 0)
			}
		})

		return comments
	}

	extractCommentsFromDOM() {
		const comments = []

		const commentSelectors = [
			'[data-testid="comment"]',
			".Comment",
			'[id*="comment-"]',
			'[data-type="comment"]',
			".commentarea .thing",
			'[data-kind="t1"]',
		]

		let commentElements = []
		for (let selector of commentSelectors) {
			commentElements = document.querySelectorAll(selector)
			if (commentElements.length > 0) break
		}

		commentElements.forEach((commentEl, index) => {
			try {
				const bodySelectors = [
					'[data-testid="comment-body-text"]',
					".md",
					".usertext-body",
					'[data-click-id="text"]',
					"p",
					".text",
				]

				let bodyElement = null
				for (let selector of bodySelectors) {
					bodyElement = commentEl.querySelector(selector)
					if (bodyElement) break
				}

				const body = bodyElement ? bodyElement.textContent.trim() : ""
				if (!body || body.length === 0) return

				const authorSelectors = [
					'[data-testid="author-link"]',
					'[data-click-id="user"]',
					'a[href*="/u/"]',
					'a[href*="/user/"]',
					".author",
				]

				let authorElement = null
				for (let selector of authorSelectors) {
					authorElement = commentEl.querySelector(selector)
					if (authorElement) break
				}

				const author = authorElement
					? authorElement.textContent.trim().replace(/^u\//, "")
					: "unknown"

				let score = 0
				const scoreSelectors = [
					'[aria-label*="upvote"]',
					'[data-testid*="upvote"]',
					".score",
					'[id*="vote-arrows"] span',
				]

				for (let selector of scoreSelectors) {
					const scoreElement = commentEl.querySelector(selector)
					if (scoreElement) {
						const scoreText = scoreElement.textContent.trim()
						const scoreMatch = scoreText.match(/[\d-]+/)
						if (scoreMatch) {
							score = parseInt(scoreMatch[0]) || 0
							break
						}
					}
				}

				let depth = 0
				const style = window.getComputedStyle(commentEl)
				const marginLeft = parseInt(style.marginLeft) || 0
				const paddingLeft = parseInt(style.paddingLeft) || 0
				depth = Math.floor((marginLeft + paddingLeft) / 30) 

				const timeAgo = `${Math.floor(Math.random() * 24)}h ago`

				comments.push({
					id: `dom_${index}`,
					author: author,
					body: body,
					score: score,
					depth: Math.max(0, depth),
					timeAgo: timeAgo,
					createdUtc: Date.now() / 1000 - Math.random() * 86400,
				})
			} catch (error) {
				console.error("Error processing comment element:", error)
			}
		})

		return comments
	}

	getTimeAgo(timestamp) {
		const now = Date.now() / 1000
		const diff = now - timestamp

		if (diff < 60) return "just now"
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
		return `${Math.floor(diff / 86400)}d ago`
	}

	async savePostFromContextMenu() {
		// Show saving notification first
		const savingNotification = this.showNotification("💾 Saving Reddit post...", 'saving')
		
		try {
			// Extract post data
			const postData = await this.extractPostData()
			if (!postData) {
				throw new Error("Could not extract post data")
			}

			// Extract comments data
			const commentsData = await this.extractCommentsData()
			const apiPostData = window.redditApiPostData || {}

			// Prepare save data (same structure as popup.js)
			const saveData = {
				id: postData.id,
				title: postData.title,
				subreddit: postData.subreddit,
				author: postData.author,
				score: postData.score,
				url: postData.url,
				selftext: apiPostData.selftext || postData.selftext || "",
				imageUrl: apiPostData.imageUrl || postData.imageUrl || "",
				savedAt: new Date().toISOString(),
				commentCount: commentsData.length,
				comments: commentsData,
			}

			// Save to storage
			const result = await chrome.storage.local.get("savedPosts")
			const savedPosts = result.savedPosts || {}
			savedPosts[saveData.id] = saveData
			await chrome.storage.local.set({ savedPosts })

			// Hide saving notification and show success
			this.hideNotification(savingNotification)
			this.showNotification("✅ Reddit post saved successfully!", 'success')
			
		} catch (error) {
			console.error("Failed to save post:", error)
			// Hide saving notification and show error
			this.hideNotification(savingNotification)
			this.showNotification("❌ Failed to save Reddit post: " + error.message, 'error')
			throw error
		}
	}

	showNotification(message, type = 'info') {
		// Create a temporary notification element
		const notification = document.createElement('div')
		
		// Set different colors based on notification type
		let backgroundColor, borderColor
		switch(type) {
			case 'success':
				backgroundColor = '#0d1117'
				borderColor = '#28a745'
				break
			case 'error':
				backgroundColor = '#0d1117'
				borderColor = '#dc3545'
				break
			case 'saving':
				backgroundColor = '#0d1117'
				borderColor = '#ffc107'
				break
			default:
				backgroundColor = '#0f1419'
				borderColor = '#30363d'
		}
		
		notification.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: ${backgroundColor};
			color: white;
			padding: 12px 20px;
			border-radius: 8px;
			border: 2px solid ${borderColor};
			box-shadow: 0 4px 12px rgba(0,0,0,0.5);
			z-index: 10000;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			font-size: 14px;
			font-weight: 500;
			transition: all 0.3s ease;
			animation: slideIn 0.3s ease;
		`
		
		// Add CSS animation
		if (!document.querySelector('#reddit-save-notification-styles')) {
			const style = document.createElement('style')
			style.id = 'reddit-save-notification-styles'
			style.textContent = `
				@keyframes slideIn {
					from { transform: translateX(100%); opacity: 0; }
					to { transform: translateX(0); opacity: 1; }
				}
				@keyframes slideOut {
					from { transform: translateX(0); opacity: 1; }
					to { transform: translateX(100%); opacity: 0; }
				}
			`
			document.head.appendChild(style)
		}
		
		notification.textContent = message
		notification.dataset.notificationType = type
		document.body.appendChild(notification)

		// Auto-remove success and error notifications after 4 seconds
		if (type === 'success' || type === 'error') {
			setTimeout(() => {
				this.hideNotification(notification)
			}, 4000)
		}
		
		return notification
	}

	hideNotification(notification) {
		if (notification && notification.parentNode) {
			notification.style.animation = 'slideOut 0.3s ease'
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification)
				}
			}, 300)
		}
	}
}

new RedditExtractor()
