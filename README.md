# 🎯 Reddit Save & View Chrome Extension

A beautiful Chrome extension to save Reddit posts and comments for offline reading with a clean, dark-themed interface.

## ✨ Features

- **🔍 Auto-detect Reddit posts** - Automatically detects when viewing a Reddit post
- **💾 Save complete posts** - Saves posts with content, images, and all nested comments
- **📱 Beautiful dark UI** - Modern interface with GitHub-inspired dark theme
- **💬 Nested comments** - Preserves reply structure with visual indentation and color coding
- **🖼️ Image support** - Displays post images inline
- **📝 Rich text** - Shows original post content with formatting
- **⚡ Offline storage** - Uses browser's local storage for offline access
- **🎨 Responsive design** - Works on all screen sizes

## 🚀 Quick Install

1. **Download** this folder to your computer
2. **Open Chrome** → `chrome://extensions/`
3. **Enable Developer Mode** (toggle top right)
4. **Click "Load unpacked"** → Select this folder
5. **Pin extension** to toolbar ✅

## 📖 How to Use

### Save a Reddit Post

1. Visit any Reddit post (e.g., `reddit.com/r/programming/comments/...`)
2. Click the 🎯 extension icon
3. Click "💾 Save This Post"
4. Wait for "✅ Post saved successfully!"

### View Saved Posts

1. Click the extension icon
2. Switch to "📚 Saved" tab
3. Click any saved post to view offline
4. Delete with 🗑️ button when done

## 🏗️ What Gets Saved

### Post Data

- Title, author, subreddit, score
- Post content (selftext) with formatting
- Post images (if any)
- External links
- Save timestamp

### Comments Data

- All comment text and replies
- Comment scores and authors
- Nested reply structure (up to 10 levels)
- Time stamps

### Storage Optimized

- Only essential data saved
- No media downloads (images linked)
- Respects Chrome storage limits

## 🎨 Features Showcase

### Dark Theme Design

- GitHub-inspired color scheme
- Gradient headers and cards
- Smooth hover effects
- Beautiful typography

### Nested Comments Display

- Color-coded indentation by depth:
  - Level 1: Blue border
  - Level 2: Red border
  - Level 3: Cyan border
  - Level 4: Orange border
  - Level 5: White border

### Post Content

- **Bold** and _italic_ text support
- Clickable links
- Line breaks preserved
- Image display with loading

## 🔧 Technical Details

### File Structure

```
reddit-save/
├── manifest.json      # Extension configuration
├── popup.html         # Main popup interface
├── popup.js          # Popup logic
├── content.js        # Reddit data extraction
├── background.js     # Service worker
├── viewer.html       # Offline viewer
├── viewer.js         # Viewer logic
├── icons/            # Extension icons
└── README.md         # This file
```

### Permissions

- `activeTab` - Read current Reddit page
- `storage` - Save posts locally
- `*://*.reddit.com/*` - Access Reddit pages

### Browser Support

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ❌ Firefox (different manifest format)

## 🐛 Troubleshooting

### Extension Not Working?

- Make sure you're on a Reddit post page
- Check URL format: `reddit.com/r/SUBREDDIT/comments/ID/`
- Try refreshing the page

### No Comments Saved?

- Some posts may have comments disabled
- Try a post with visible comments
- Check browser console for errors

### Clear Storage (if needed)

```javascript
// Open browser console (F12) and run:
chrome.storage.local.clear()
```

## 🔮 Future Ideas

- [ ] Export saved posts to files
- [ ] Search within saved posts
- [ ] Categories and tagging
- [ ] Bulk operations
- [ ] Sync across devices

## 📝 License

MIT License - Free to use and modify!

## 🤝 Contributing

Found a bug or want to add features? Feel free to:

1. Fork the project
2. Make improvements
3. Test thoroughly
4. Submit changes

---

**Made with ❤️ for Reddit users who love to save great content!**

Save your favorite discussions, tutorials, and stories for offline reading with beautiful formatting that preserves the original Reddit experience.
