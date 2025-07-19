class PostViewer {
	constructor() {
		this.setupEventListeners()
		this.init()
	}

	async init() {
		const urlParams = new URLSearchParams(window.location.search)
		const postId = urlParams.get("postId")

		if (!postId) {
			this.showError("No post ID provided")
			return
		}

		await this.loadPost(postId)
	}

	async loadPost(postId) {
		try {
			const result = await chrome.storage.local.get("savedPosts")
			const savedPosts = result.savedPosts || {}
			const post = savedPosts[postId]

			if (!post) {
				this.showError("Post not found")
				return
			}

			this.displayPost(post)
		} catch (error) {
			console.error("Error loading post:", error)
			this.showError("Error loading post")
		}
	}

	displayPost(post) {
		const contentDiv = document.getElementById("content")

		const postHtml = `
            <div class="post-container">
                <div class="post-header">
                    <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
                    <div class="post-meta">
                        <span class="score${
													post.score < 0 ? " negative" : ""
												}">${post.score < 0 ? "👎" : "👍"} ${Math.abs(
			post.score
		)} ${post.score < 0 ? "downvotes" : "upvotes"}</span>
                        <span class="subreddit">📍 ${post.subreddit}</span>
                        <span class="meta-item">👤 u/${post.author}</span>
                        <span class="meta-item">💬 ${
													post.commentCount
												} comments</span>
                        <span class="meta-item">💾 ${this.getTimeAgo(
													post.savedAt
												)}</span>
                    </div>
                </div>
                ${this.renderPostContent(post)}
            </div>
        `

		const commentsHtml = `
            <div class="comments-section">
                <div class="comments-header">
                    <h3 class="comments-title">💬 Comments (${
											post.comments?.length || 0
										})</h3>
                </div>
                ${(post.comments || [])
									.map((comment) => this.formatComment(comment))
									.join("")}
            </div>
        `

		contentDiv.innerHTML = postHtml + commentsHtml
	}

	renderPostContent(post) {
		let contentHtml = ""

		if (post.imageUrl) {
			contentHtml += `
                <div class="post-image">
                    <img src="${post.imageUrl}" alt="Post image" loading="lazy" />
                </div>
            `
		}

		if (post.selftext && post.selftext.trim()) {
			contentHtml += `
                <div class="post-content">
                    ${this.formatPostText(post.selftext)}
                </div>
            `
		}

		if (post.url && !post.url.includes("reddit.com") && !post.imageUrl) {
			contentHtml += `
                <div class="post-link">
                    <a href="${
											post.url
										}" target="_blank" rel="noopener noreferrer">
                        🔗 ${this.escapeHtml(post.url)}
                    </a>
                </div>
            `
		}

		return contentHtml
	}

	formatPostText(text) {
		if (!text) return ""

		return text
			.split("\n\n")
			.map((paragraph) => paragraph.trim())
			.filter((paragraph) => paragraph.length > 0)
			.map((paragraph) => {
				paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

				paragraph = paragraph.replace(/\*(.*?)\*/g, "<em>$1</em>")

				paragraph = paragraph.replace(
					/\[([^\]]+)\]\(([^)]+)\)/g,
					'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
				)

				return `<p>${paragraph.replace(/\n/g, "<br>")}</p>`
			})
			.join("")
	}

	formatComment(comment) {
		const depthClass = `depth-${Math.min(comment.depth || 0, 5)}`

		return `
            <div class="comment ${depthClass}">
                <div class="comment-header">
                    <span class="comment-author">u/${this.escapeHtml(
											comment.author
										)}</span>
                    <span class="comment-score${
											comment.score < 0 ? " negative" : ""
										}">${comment.score < 0 ? "👎 -" : "👍 "}${Math.abs(
			comment.score
		)}</span>
                    <span class="comment-time">${comment.timeAgo}</span>
                    ${
											comment.depth > 0
												? `<span class="reply-indicator">↳ Level ${comment.depth}</span>`
												: ""
										}
                </div>
                <div class="comment-body ${depthClass}">
                    ${this.formatText(comment.body)}
                </div>
            </div>
        `
	}

	formatText(text) {
		if (!text) return ""

		return text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.map((line) => `<p>${this.escapeHtml(line)}</p>`)
			.join("")
	}

	escapeHtml(text) {
		const div = document.createElement("div")
		div.textContent = text
		return div.innerHTML
	}

	getTimeAgo(timestamp) {
		const now = new Date()
		const saved = new Date(timestamp)
		const diffMs = now - saved
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMs / 3600000)
		const diffDays = Math.floor(diffMs / 86400000)

		if (diffMins < 60) return `Saved ${diffMins}m ago`
		if (diffHours < 24) return `Saved ${diffHours}h ago`
		return `Saved ${diffDays}d ago`
	}

	showError(message) {
		document.getElementById("content").innerHTML = `
            <div class="error">
                <h2>❌ Error</h2>
                <p>${message}</p>
            </div>
        `
	}
}

document.addEventListener("DOMContentLoaded", () => {
	new PostViewer()
})
