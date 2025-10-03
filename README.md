# Gather.town Notification Notifier

*This code was written by Claude Code.*

A Chrome extension that displays desktop notifications when you receive wave, chat, or call notifications in gather.town.

[Chrome Web Store](https://chromewebstore.google.com/detail/gathertown-wavechat-notif/ipilclmmmipimknhiklcnpidkcdjooad?authuser=0)

## Features

- **Advanced Notification Detection**: Multi-method detection using console log monitoring and DOM-based observation
- **Audio Notifications**: Acoustic feedback based on notification type
- **Do Not Disturb Mode**: Temporary notification pause functionality for focused work
- **Automatic Tab Management**: Automatic creation and management of Gather.town tabs
- **Configurable**: Enable/disable settings for each notification type
- **Debug Mode**: Optional debug logging for troubleshooting and development
- **Multi-language Support**: Supports Japanese, English, German, and French (automatically selected based on browser language settings)

## Functionality

1. **Notification Detection**: Monitors gather.town console logs to detect wave, chat, call, and calendar notifications
2. **Desktop Notifications**: Displays desktop notifications when notifications are detected
3. **Badge Display**: Shows notification status with badges on the extension icon
4. **Tab Management**: Clear notifications and activate gather.town tab by clicking the icon
5. **Notification Click**: Click desktop notifications to automatically activate gather.town tab
6. **Auto Clear**: Automatically clear notifications when gather.town tab becomes active
7. **Audio Notifications**: Loop audio playback during notifications (stops when notifications are cleared)
8. **Focus Mode**: Do not disturb mode functionality that disables notifications for a certain period
9. **Settings Management**: Individual enable/disable toggle for each notification type (Wave, Chat, Call, Calendar)
10. **Version Selection**: Choose between Gather V1 or V2 for tab creation
11. **Auto Tab Creation**: Automatic tab creation when gather.town tab is not found (uses selected version)
12. **Language Selection**: Manual language selection dropdown in popup (Auto/English/Japanese/German/French)
13. **Debug Mode**: Debug logging toggle for troubleshooting (enabled via checkbox in bottom left of popup)
14. **Internationalization**: Automatically displays messages in appropriate language based on browser language settings or manual selection

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
6. Select your preferred language from the dropdown (marked with 🌐) at the bottom right of the popup
7. Enable debug mode using the checkbox in the bottom left of the popup for detailed logging

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

## Recent Updates

### Version 1.8 - Multi-Language Support
- **V2 multi-language detection**: All V2 notifications now support English, Portuguese, and Japanese
- **Wave detection patterns**:
  - English: "$name waved to you"
  - Portuguese: "$name acenou para você"
  - Japanese: "$nameさんが手を振りました"
- **Chat detection patterns**:
  - English: "$name sent a message"
  - Portuguese: "$name enviou uma mensagem"
  - Japanese: "$nameさんがメッセージを送信しました"
- **Calendar detection patterns**:
  - English: "in $n minutes"
  - Portuguese: "em $n minutos"
  - Japanese: "$n 分後"
- **Concentration mode detection**:
  - English: "Enter office"
  - Portuguese: "Entrar no escritório"
  - Japanese: "オフィスに入る"
- **Automatic language detection**: Works seamlessly with user's Gather V2 language preference

### Version 1.7 - Comprehensive V2 Support
- **V2 notifications (DOM-based detection)**:
  - Wave: Detects "$name waved to you" in DOM
  - Chat: Detects "$name sent a message" in DOM
  - Calendar: Detects "in $n minutes" in DOM
- **V1 notifications (Console log detection)**:
  - Wave: "Alerting Wave event"
  - Chat: "Skipping ChatV2 notification"
  - Call: "Alerting Ring event"
- **User name extraction**: Wave and Chat notifications now include the sender's name (e.g., "John waved to you!")
- **Flexible calendar detection**: Supports any time interval (1 minute, 5 minutes, 10 minutes, etc.)
- **V2 concentration mode support**:
  - Auto-detection of V2 concentration mode via "Enter office" button
  - Multi-language support (English "Enter office" / Japanese "オフィスに入る")
  - Automatic clicking to exit concentration mode when toggled off
- **Improved reliability**: DOM-based detection (V2) is more accurate than console log monitoring (V1)
- **Enhanced debugging**: Comprehensive debug logging to diagnose detection and audio issues

### Version 1.6 - Enhanced DOM-Based Detection
- **DOM-based wave detection**: Added MutationObserver to detect wave notifications by DOM content ("waved to you")
- **Dual-method detection**: Combines console log monitoring and DOM observation for improved reliability
- **Better notification distinction**: More accurate wave detection using actual notification elements
- **Version indicators**: Popup UI now shows "(V1 only)" and "(V2 only)" labels for version-specific features

### Version 1.5 - Gather V2 Support
- **Gather V2 domain support**: Added support for the new Gather V2 domain (`app.v2.gather.town`)
- **Calendar notification type**: New notification type with dedicated settings toggle (V2 only)
- **Version selector**: Users can now choose between V1 or V2 when creating new Gather.town tabs
- **Backward compatibility**: Both V1 and V2 notification patterns are supported simultaneously

### Version 1.4 - Debug Mode Enhancement
- **Optimized monitoring logs**: The `[WAVE-NOTIFIER-CONTENT] Monitoring active at` message now only appears when debug mode is enabled
- **Comprehensive log optimization**: All `console.log` statements are now wrapped with debug mode checks
- **Improved log quality**: Significantly reduced unnecessary log output during normal usage, showing detailed logs only during debugging
- **Error log preservation**: `console.error` statements remain always visible to ensure important error information is preserved

## Supported Languages

The extension automatically detects your browser's language setting and displays messages in the appropriate language:

- **English (en)** - Default language
- **Japanese (ja)** - 日本語
- **German (de)** - Deutsch
- **French (fr)** - Français

If your browser language is not supported, the extension will fall back to English.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
