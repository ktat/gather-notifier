# Gather.town Notification Notifier

*This code was written by Claude Code.*

A Chrome extension that displays desktop notifications when you receive wave, chat, or call notifications in gather.town.

[Chrome Web Store](https://chromewebstore.google.com/detail/gathertown-wavechat-notif/ipilclmmmipimknhiklcnpidkcdjooad?authuser=0)

## Features

- **Advanced Notification Detection**: Reliable log monitoring using both MAIN world and ISOLATED world
- **Audio Notifications**: Acoustic feedback based on notification type
- **Do Not Disturb Mode**: Temporary notification pause functionality for focused work
- **Automatic Tab Management**: Automatic creation and management of Gather.town tabs
- **Configurable**: Enable/disable settings for each notification type
- **Multi-language Support**: Supports Japanese, English, German, and French (automatically selected based on browser language settings)

## Functionality

1. **Notification Detection**: Monitors gather.town console logs to detect wave, chat, and call notifications
2. **Desktop Notifications**: Displays desktop notifications when notifications are detected
3. **Badge Display**: Shows notification status with badges on the extension icon
4. **Tab Management**: Clear notifications and activate gather.town tab by clicking the icon
5. **Auto Clear**: Automatically clear notifications when gather.town tab becomes active
6. **Audio Notifications**: Loop audio playback during notifications (stops when notifications are cleared)
7. **Focus Mode**: Do not disturb mode functionality that disables notifications for a certain period
8. **Settings Management**: Individual enable/disable toggle for each notification type
9. **Auto Tab Creation**: Automatic tab creation when gather.town tab is not found
10. **Internationalization**: Automatically displays messages in appropriate language based on browser language settings

## Installation

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select this folder

## Usage

1. Install the extension and open a Gather.town page
2. Wave, Chat, and Call notifications are automatically detected and desktop notifications are displayed
3. Click the extension icon to change settings from the popup
4. Use do not disturb mode to temporarily disable notifications
5. Use the "Go to Gather.town" button to automatically create/switch tabs

## Creating Icons

Open `create-icons.html` in your browser to download icons of each size.

## File Structure

### Main Files
- `manifest.json` - Extension configuration and permission definitions
- `background.js` - Background script (notification processing and state management)
- `content.js` - ISOLATED world content script (event reception)
- `content_main.js` - MAIN world content script (console log monitoring)
- `popup.html` - Popup UI
- `popup.js` - Popup behavior and event processing
- `offscreen.html` - Offscreen document (for audio playback)
- `offscreen.js` - Audio playback processing using Web Audio API

### Asset Files
- `icon*.png` - Extension icons (16px, 32px, 48px, 128px)
- `create-icons.html` - HTML file for icon creation

### Internationalization Files
- `_locales/en/messages.json` - English resources
- `_locales/ja/messages.json` - Japanese resources
- `_locales/de/messages.json` - German resources
- `_locales/fr/messages.json` - French resources

### Documentation
- `docs/spec/` - Technical specifications and architecture documents
- `CLAUDE.md` - Development workflow instructions
- `README-ja.md` - Japanese version of this README

## Supported Languages

The extension automatically detects your browser's language setting and displays messages in the appropriate language:

- **English (en)** - Default language
- **Japanese (ja)** - 日本語
- **German (de)** - Deutsch
- **French (fr)** - Français

If your browser language is not supported, the extension will fall back to English.
