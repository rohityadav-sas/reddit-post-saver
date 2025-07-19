# Reddit Save & View Chrome Extension

This Chrome extension allows users to save Reddit posts and comments for offline reading with a clean interface. It automatically detects Reddit posts and provides a streamlined way to save and view content later.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Saving Reddit Posts](#saving-reddit-posts)
    - [Viewing Saved Posts](#viewing-saved-posts)
- [Features](#features)
- [Technical Details](#technical-details)
- [License](#license)
- [Contributing](#contributing)

## Installation

1. Download the extension files.

2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the folder containing the extension files.

## Usage

1. Click on the extension icon in the Chrome toolbar.

2. Navigate to any Reddit post page.
3. The extension will automatically detect the post.
4. Click "Save This Post" to save it for offline reading.

### Saving Reddit Posts

1. Visit any Reddit post (e.g., `reddit.com/r/programming/comments/...`)

2. Click the extension icon in the Chrome toolbar
3. Click "💾 Save This Post" button
4. Wait for "✅ Post saved successfully!" confirmation

### Viewing Saved Posts

1. Click the extension icon

2. Switch to the "📚 Saved" tab
3. Click on any saved post to view it offline
4. Use the 🗑️ delete button to remove posts when no longer needed

## Features

- Automatic Reddit post detection

- Complete post saving with content, images, and nested comments
- Beautiful dark theme interface with GitHub-inspired design
- Nested comment structure preservation with color-coded indentation
- Image support with inline display
- Offline storage using browser's local storage
- Responsive design for all screen sizes
- Comment score indicators with emoji visualization

## Technical Details

### File Structure

```
reddit-save/
├── manifest.json      # Extension configuration
├── popup.html         # Main popup interface
├── popup.js          # Popup logic and functionality
├── content.js        # Reddit data extraction script
├── background.js     # Service worker
├── viewer.html       # Offline post viewer
├── viewer.js         # Viewer logic and rendering
├── icons/            # Extension icons (16x16, 32x32, 48x48, 128x128)
└── README.md         # Documentation
```

### Browser Support

- ✅ Chrome (Manifest V3)

- ✅ Chromium-based browsers

### Permissions

- `activeTab` - Read current Reddit page content

- `storage` - Save posts to local browser storage
- `*://*.reddit.com/*` - Access Reddit pages for data extraction

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
