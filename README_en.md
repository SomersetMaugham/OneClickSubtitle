# YouTube Subtitle Converter (YouTube 자막 변환기)

A Chrome extension that automatically translates YouTube video subtitles to your system language with a single click. Uses YouTube's built-in auto-translate feature to automate the otherwise multi-step process into one button click.

<img width="1372" height="775" alt="OneClickSub" src="https://github.com/user-attachments/assets/a63a792e-5347-4e73-847d-60cb02e57f32" />

## ✨ Features

- **One-Click Translation**: Click the `[A]` button added to the YouTube player controls to instantly activate subtitles in your system language.
- **Automated Process**: Automatically handles the complex steps: `Settings > Subtitles > English (auto-generated) > Subtitles > Auto-translate > [Target Language]`
- **Toast Notifications**: Shows intuitive toast messages for subtitle activation/deactivation status or unsupported videos.
- **Full SPA Support**: Works seamlessly with YouTube's SPA navigation when switching between videos.

## 📦 Installation (Developer Mode)

This extension can be installed locally without downloading from the Chrome Web Store.

1. Clone this repo or download as ZIP and extract.
2. Open Google Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** toggle in the top right.
4. Click **Load unpacked** button in the top left.
5. Select the `OneClickSubtitle` folder.
6. The extension will appear in your extension list.

## 🚀 Usage

1. Play any YouTube video.
2. Find the new **[A]** icon button on the player controls (next to the settings icon).
3. Click the button to automatically activate subtitles in your system language.
4. Click again to toggle subtitles off.

> **Note**: This extension requires auto-generated captions or existing subtitles in the video. It won't work on videos with no captions available.

## 🛠 Tech Stack

- JavaScript (Vanilla)
- CSS3
- Chrome Extension Manifest V3

## 📝 Supported Languages

- Korean (한국어)
- Japanese (日本語)
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Portuguese (Português)
- Russian (Русский)
- Chinese (中文)
- Italian (Italiano)
- Dutch (Nederlands)
- Hindi (हिन्दी)
- Arabic (العربية)
- Indonesian (Bahasa Indonesia)
- Filipino (Filipino)
- Urdu (اردو)
- Persian (فارسی)

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.