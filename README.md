# 🍝 Emojipasta Generator - Chrome Extension

Transform any text on the web into hilarious, irreverent emojipasta using AI! Select text, right-click, and watch as OpenAI GPT turns boring text into emoji-laden masterpieces.

## Features

- 🎯 **Context Menu Integration**: Right-click any selected text to generate emojipasta
- 🎛️ **Three Style Modes**: Trump tweet (🇺🇸) → Edgy (🔥😏) → Vulgar (🍆💦🫦)
- 🪟 **Modal Display**: Results appear in a beautiful modal window with copy, read aloud, and regenerate options
- 📋 **Easy Copying**: One-click copy to clipboard from the modal or popup
- 🔊 **Read Aloud**: Text-to-speech to hear your emojipasta out loud
- 🔄 **Regenerate**: Adjust style and regenerate without reselecting text
- 🏠 **Popup Access**: Click the extension icon to view your most recent emojipasta
- 🤖 **Model Selection**: Choose between gpt-4o-mini (faster, cheaper) or gpt-4o (better quality)
- 🔒 **Privacy-First**: Your API key is stored locally in your browser
- ⚡ **Fast & Affordable**: Default gpt-4o-mini model for quick, cost-effective results
- 📏 **Character Limits**: Validates text length (100-1000 characters) before making API calls

## Installation

### Prerequisites

- Chrome browser (or any Chromium-based browser)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Setup

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension directory
5. Click the extension icon and enter your OpenAI API key
6. Start generating emojipasta!

## Usage

1. **Set API Key**: Click the extension icon, expand settings, and enter your OpenAI API key (one-time setup)
   - Key format is validated in real-time (must start with `sk-`)
   - Cost: ~$0.008 per generation with gpt-4o-mini, ~$0.16 per generation with gpt-4o
2. **Choose Model** (optional): Select your preferred model in the popup settings
   - **4o-mini** (⚡ Faster): Default, cost-effective, good quality
   - **4o** (💎 Better): Higher quality, costs ~20x more
3. **Select Text**: Highlight any text on any webpage (100-1000 characters)
4. **Generate**: Right-click and select "🍝 Generate Emojipasta"
5. **View Results**: A modal window appears with your generated text
6. **Adjust & Regenerate**: Change the style and click regenerate:
   - **🇺🇸 (Level 0)**: Trump tweet style - ALL CAPS, no emojis, exclamation points, formal sign-off
   - **🔥😏 (Level 5)**: Edgy, sassy, funny with mild swears and innuendo
   - **🍆💦🫦 (Level 10)**: Vulgar, absurd, excessive emojis, uncensored
7. **Copy**: Click "📋 Copy" to copy to clipboard
8. **Read Aloud**: Click "🔊 Read" to hear your emojipasta (click again to stop)
9. **View Later**: Click the extension icon anytime to see your most recent emojipasta

## Examples

**Original**: "I'm going to the store to buy some groceries"

**Trump Tweet (Level 0)**: "GOING TO THE STORE TO BUY GROCERIES! AMAZING SELECTION, TREMENDOUS QUALITY! We're going to have the best groceries, believe me. Thank you for your attention to this matter"

**Edgy (Level 5)**: "Yo I'm bout to drag my ass 🍑 to the store 🏪 to grab some groceries 🛒🥬 like a functioning adult 💀 wish me luck fam 🙏😤"

**Vulgar (Level 10)**: "Yo I'm about to haul my ass 🍑🚶‍♂️ to the goddamn store 🏪💀 to cop some motherfucking groceries 🛒💸🥬🍞 like a responsible adult 👨‍🦳📋 and sh*t 💩😤"

## Development

### File Structure

```
emojipasta-chrome/
├── manifest.json          # Extension manifest
├── constants.js          # Shared constants across all scripts
├── popup.html            # Extension popup UI
├── popup.css             # Popup styling
├── popup.js              # Popup logic
├── background.js         # Service worker (API calls)
├── content.js            # Content script (text selection, modal)
├── content.css           # Content script styling (modal, notifications)
└── icons/                # Extension icons
```

### API Usage

This extension uses the OpenAI API with your choice of model. Costs are approximately:

**gpt-4o-mini** (Default):
- ~$0.008 per request (less than 1 cent)
- Pricing: $0.15/M input tokens, $0.60/M output tokens
- Great quality for emojipasta

**gpt-4o**:
- ~$0.16 per request (16 cents)
- Pricing: $2.50/M input tokens, $10/M output tokens
- Higher quality, costs ~20x more

Both models use:
- Token limit: 1024 tokens per generation
- Temperature: 1.2 (creative and fun)
- Character limits: 100-1000 characters input

## Privacy

- Your API key is stored locally in Chrome's storage (never sent anywhere except OpenAI)
- Selected text is only sent to OpenAI API when you explicitly generate emojipasta
- No analytics or tracking
- No data is stored on external servers

## Troubleshooting

**"Please set your OpenAI API key"**
- Click the extension icon and enter your API key from platform.openai.com/api-keys
- Make sure the key starts with `sk-`

**"API key must start with 'sk-'"**
- The API key format is invalid. Get a valid key from platform.openai.com/api-keys

**"Selected text is too short (min 100 characters)"**
- The extension requires at least 100 characters to generate quality results
- Select a longer portion of text

**"Selected text is too long (max 1000 characters)"**
- The extension limits input to 1000 characters to control costs
- Select a shorter portion of text

**"Selected text must contain at least some letters"**
- The selected text contains only numbers or symbols
- Select text that includes at least some alphabetic characters

**"API request failed: 401" or "Invalid API key"**
- Your API key is invalid or expired
- Get a new one from platform.openai.com/api-keys
- Re-enter it in the extension popup

**"API request failed: 429" or "Rate limit exceeded"**
- You've hit your API rate limit or quota
- Wait a moment and try again, or check your OpenAI billing

**Context menu doesn't appear**
- Make sure you've selected text before right-clicking
- Refresh the page after installing/updating the extension
- Try reloading the extension in chrome://extensions/

**Modal doesn't appear after generating**
- Check the browser console for errors (F12 > Console)
- Make sure the content script loaded (refresh the page)
- The page might block the modal CSS - try a different site

**Regenerate button doesn't work**
- Make sure you have a valid API key set
- Check your browser console for errors
- The modal will show error notifications if something fails

## Credits

- Built with vanilla JavaScript
- Uses [OpenAI API](https://openai.com)
- Inspired by the rich tradition of internet copypasta

## License

MIT License - Feel free to modify and use however you want!

---

Made with 💜 and way too many emojis
