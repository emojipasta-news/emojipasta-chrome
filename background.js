// background.js

// Import shared constants
importScripts('constants.js');

// Validation helper
function validateText(text) {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'No text selected' };
  }

  if (!LETTER_REGEX.test(text)) {
    return { valid: false, error: 'Selected text must contain at least some letters' };
  }

  if (text.length < MIN_CHARS) {
    return { valid: false, error: `Selected text is too short (min ${MIN_CHARS} characters)` };
  }

  if (text.length > MAX_CHARS) {
    return { valid: false, error: `Selected text is too long (max ${MAX_CHARS} characters)` };
  }

  return { valid: true };
}

// Error recovery helper
function notifyRegenerateError(tabId, message) {
  notifyTab(tabId, message, 'error');
  chrome.tabs.sendMessage(tabId, { type: 'regenerate-error' }).catch(() => {});
}

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generate-emojipasta',
    title: 'Generate Emojipasta',
    contexts: ['selection']
  });

  // Set default vulgarity level if not already set
  chrome.storage.local.get(['vulgarityLevel'], (result) => {
    if (result.vulgarityLevel === undefined) {
      chrome.storage.local.set({ vulgarityLevel: DEFAULT_VULGARITY_LEVEL });
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'generate-emojipasta') {
    handleGenerateEmojipasta(info.selectionText, tab.id);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'regenerate-emojipasta') {
    handleRegenerateEmojipasta(message.text, message.vulgarityLevel, sender.tab.id);
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

// Generate emojipasta
async function handleGenerateEmojipasta(selectedText, tabId) {
  // Validate text
  const validation = validateText(selectedText);
  if (!validation.valid) {
    notifyTab(tabId, validation.error, 'error');
    return;
  }

  // Get API key and vulgarity level from storage
  const { openaiApiKey, vulgarityLevel } = await chrome.storage.local.get([
    'openaiApiKey',
    'vulgarityLevel'
  ]);
  
  if (!openaiApiKey) {
    notifyTab(tabId, 'Please set your OpenAI API key in the extension popup', 'error');
    return;
  }
  
  notifyTab(tabId, 'Generating emojipasta... 🍝', 'info');

  // Get selected model
  const { openaiModel } = await chrome.storage.local.get(['openaiModel']);
  const model = openaiModel || MODEL_OPTIONS.DEFAULT;

  try {
    const result = await generateEmojipasta(selectedText, openaiApiKey, vulgarityLevel || DEFAULT_VULGARITY_LEVEL, model);

    // Save last result to storage
    chrome.storage.local.set({ lastEmojipasta: result });

    // Show result in modal on the page
    chrome.tabs.sendMessage(tabId, {
      type: 'show-result',
      result: result,
      originalText: selectedText
    }).catch(() => {
      // Content script might not be loaded, fallback to notification
      notifyTab(tabId, 'Emojipasta copied to clipboard! 🎉', 'success');
    });

    // Send result to popup if it's open
    chrome.runtime.sendMessage({
      type: 'emojipasta-result',
      result: result
    }).catch(() => {
      // Popup not open, that's okay
    });
    
  } catch (error) {
    console.error('Error generating emojipasta:', error);
    notifyTab(tabId, `Error: ${error.message}`, 'error');
  }
}

// Regenerate emojipasta with new vulgarity level
async function handleRegenerateEmojipasta(originalText, vulgarityLevel, tabId) {
  // Validate text
  const validation = validateText(originalText);
  if (!validation.valid) {
    notifyRegenerateError(tabId, validation.error);
    return;
  }

  // Get API key and selected model from storage
  const { openaiApiKey, openaiModel } = await chrome.storage.local.get(['openaiApiKey', 'openaiModel']);

  if (!openaiApiKey) {
    notifyRegenerateError(tabId, 'Please set your OpenAI API key in the extension popup');
    return;
  }

  const model = openaiModel || MODEL_OPTIONS.DEFAULT;

  try {
    const result = await generateEmojipasta(originalText, openaiApiKey, vulgarityLevel, model);

    // Save last result to storage
    chrome.storage.local.set({ lastEmojipasta: result });

    // Update result in existing modal
    chrome.tabs.sendMessage(tabId, {
      type: 'update-result',
      result: result
    }).catch(() => {
      console.error('Failed to update modal');
    });

  } catch (error) {
    console.error('Error regenerating emojipasta:', error);
    notifyRegenerateError(tabId, `Error: ${error.message}`);
  }
}

// Generate emojipasta using OpenAI API
async function generateEmojipasta(text, apiKey, vulgarityLevel, model) {
  const prompt = buildPrompt(text, vulgarityLevel);
  console.log(prompt);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      max_tokens: OPENAI_MAX_TOKENS,
      temperature: OPENAI_TEMPERATURE,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error?.message || `API request failed: ${response.status}`;
    
    // Add specific error messages for common HTTP status codes
    if (response.status === 401) {
      errorMessage = 'Invalid API key. Please check your OpenAI API key in settings.';
    } else if (response.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if ([500, 502, 503].includes(response.status)) {
      errorMessage = 'OpenAI API is temporarily unavailable. Please try again later.';
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error('Invalid response format from API');
  }
  
  if (!data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('No text content in API response');
  }
  
  return data.choices[0].message.content;
}

// Build prompt based on vulgarity level
function buildPrompt(text, vulgarityLevel) {
  const vulgarityInstructions = getVulgarityInstructions(vulgarityLevel);
  const levelNum = parseInt(vulgarityLevel);

  // Different example format for Trump tweet style
  if (levelNum === 0) {
    return `Convert the text into Trump tweet style: some words in ALL CAPS for emphasis, short punchy sentences, LOTS OF EXCLAMATION POINTS! Superlatives (AMAZING, TREMENDOUS, UNBELIEVABLE). NO EMOJIS. single paragraph. Rude and insulting. End with "Thank you for your attention to this matter."

  Text: "${text}"`;
  }

  // Default emojipasta format
  return `
  Write a short, unhinged emojipasta (4 sentences) about the following text. Use puns, excessive emojis 🤪💀🔥 and an over-the-top, chaotic tone. 
  No intro or outro. ${vulgarityInstructions}

  example: 🌞🌚HOLY F**K it's a solar eclipse, baby, and the moon just rawdogged the sun with zero lube 🌝🍆🔥  some nerd called it “astronomy” but I call it CELESTIAL COCKBLOCKING ☀️❌🌚 I looked directly at it and now I see into the 5th dimension 🧠🌌👁️ send this to 5 astrothots or your retinas will get pegged by Helios himself 🔥👁️🍑⚰️

  Text: "${text}"`;
}

// Get vulgarity-specific instructions
function getVulgarityInstructions(level) {
  const levelNum = parseInt(level);

  if (levelNum <= 3) {
    return `Playful, family-friendly. Lots of emojis, no offensive language.`;
  } else if (levelNum <= 7) {
    return `Edgy, sassy. Many emojis. Funny, irreverent, use innuendo. Mild swears OK.`;
  } else {
    return `Be vulgar, absurd, and rude, with sexual innuendo, random slang, and aggressive humor, uncensored profanity.`;
  }
}

// Send notification to content script
function notifyTab(tabId, message, status) {
  chrome.tabs.sendMessage(tabId, {
    type: 'show-notification',
    message: message,
    status: status
  }).catch(() => {
    // Content script might not be loaded yet, that's okay
  });
}
