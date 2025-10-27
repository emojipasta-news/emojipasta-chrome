// popup.js

// DOM elements
const lastResultDiv = document.getElementById('lastResult');
const resultActionsDiv = document.getElementById('resultActions');
const copyBtn = document.getElementById('copyBtn');
const readBtn = document.getElementById('readBtn');
const settingsToggle = document.getElementById('settingsToggle');
const settingsContent = document.getElementById('settingsContent');
const toggleArrow = document.querySelector('.toggle-arrow');
const apiKeyInput = document.getElementById('apiKey');
const apiKeyError = document.getElementById('apiKeyError');
const saveApiKeyButton = document.getElementById('saveApiKey');
const modelMiniBtn = document.getElementById('modelMini');
const model4oBtn = document.getElementById('model4o');
const costWarning = document.getElementById('costWarning');

// Track speech synthesis
let currentSpeech = null;

// Load and display last result on popup open
chrome.storage.local.get(['lastEmojipasta', 'openaiApiKey', 'vulgarityLevel', 'openaiModel'], (result) => {
  if (chrome.runtime.lastError) {
    console.error('Error loading data:', chrome.runtime.lastError);
    return;
  }

  // Display last emojipasta if available
  if (result.lastEmojipasta) {
    lastResultDiv.textContent = result.lastEmojipasta;
    resultActionsDiv.style.display = 'flex';
  }

  // Set active vulgarity button
  const level = result.vulgarityLevel !== undefined ? result.vulgarityLevel : VULGARITY_LEVELS.DEFAULT;
  setActiveVulgarityButton(level);

  // Set active model button
  const model = result.openaiModel || MODEL_OPTIONS.DEFAULT;
  setActiveModelButton(model);

  // Pre-fill API key if it exists (masked)
  if (result.openaiApiKey) {
    apiKeyInput.value = result.openaiApiKey;
  }
});

// Settings toggle (collapse/expand)
settingsToggle.addEventListener('click', () => {
  const isOpen = settingsContent.style.display === 'block';

  if (isOpen) {
    settingsContent.style.display = 'none';
    toggleArrow.classList.remove('open');
  } else {
    settingsContent.style.display = 'block';
    toggleArrow.classList.add('open');
  }
});

// Copy button
copyBtn.addEventListener('click', () => {
  const text = lastResultDiv.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, COPY_FEEDBACK_DURATION);
  }).catch((error) => {
    console.error('Failed to copy to clipboard:', error);
  });
});

// Read aloud button
readBtn.addEventListener('click', () => {
  const text = lastResultDiv.textContent;

  // If already speaking, stop
  if (currentSpeech && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    currentSpeech = null;
    readBtn.textContent = '🔊 Read Aloud';
    return;
  }

  // Start reading
  currentSpeech = new SpeechSynthesisUtterance(text);
  currentSpeech.rate = 1.0;
  currentSpeech.pitch = 1.0;
  currentSpeech.volume = 1.0;

  currentSpeech.onstart = () => {
    readBtn.textContent = '⏸️ Stop';
  };

  currentSpeech.onend = () => {
    readBtn.textContent = '🔊 Read Aloud';
    currentSpeech = null;
  };

  currentSpeech.onerror = () => {
    readBtn.textContent = '🔊 Read Aloud';
    currentSpeech = null;
  };

  window.speechSynthesis.speak(currentSpeech);
});

// API key validation
apiKeyInput.addEventListener('input', () => {
  validateApiKey();
});

function validateApiKey() {
  const apiKey = apiKeyInput.value.trim();

  if (apiKey.length > 0 && !apiKey.startsWith(API_KEY_PREFIX)) {
    apiKeyInput.classList.add(CSS_CLASSES.INVALID);
    apiKeyError.textContent = `API key must start with "${API_KEY_PREFIX}"`;
    apiKeyError.style.display = 'block';
    saveApiKeyButton.disabled = true;
    return false;
  } else {
    apiKeyInput.classList.remove(CSS_CLASSES.INVALID);
    apiKeyError.style.display = 'none';
    saveApiKeyButton.disabled = false;
    return true;
  }
}

// Save API key
saveApiKeyButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    apiKeyError.textContent = 'Please enter an API key';
    apiKeyError.style.display = 'block';
    return;
  }

  if (!validateApiKey()) {
    return;
  }

  chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving API key:', chrome.runtime.lastError);
      apiKeyError.textContent = 'Failed to save API key';
      apiKeyError.style.display = 'block';
      return;
    }

    // Show success feedback
    const originalText = saveApiKeyButton.textContent;
    saveApiKeyButton.textContent = '✓ Saved!';
    setTimeout(() => {
      saveApiKeyButton.textContent = originalText;
    }, COPY_FEEDBACK_DURATION);
  });
});

// Model toggle buttons
modelMiniBtn.addEventListener('click', () => {
  setActiveModelButton(MODEL_OPTIONS.MINI);
  chrome.storage.local.set({ openaiModel: MODEL_OPTIONS.MINI });
});

model4oBtn.addEventListener('click', () => {
  setActiveModelButton(MODEL_OPTIONS.STANDARD);
  chrome.storage.local.set({ openaiModel: MODEL_OPTIONS.STANDARD });
});

function setActiveModelButton(model) {
  const isMini = model === MODEL_OPTIONS.MINI;

  if (isMini) {
    modelMiniBtn.classList.add('active');
    model4oBtn.classList.remove('active');
    costWarning.style.display = 'none';
  } else {
    modelMiniBtn.classList.remove('active');
    model4oBtn.classList.add('active');
    costWarning.style.display = 'block';
  }
}

// Vulgarity buttons
function setupVulgarityButtons() {
  const buttons = document.querySelectorAll(`.${CSS_CLASSES.SEGMENT_BTN}`);
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const level = parseInt(button.dataset.level);

      // Update active state
      buttons.forEach(btn => btn.classList.remove(CSS_CLASSES.ACTIVE));
      button.classList.add(CSS_CLASSES.ACTIVE);

      // Save to storage
      chrome.storage.local.set({ vulgarityLevel: level }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving vulgarity level:', chrome.runtime.lastError);
        }
      });
    });
  });
}

function setActiveVulgarityButton(level) {
  const buttons = document.querySelectorAll(`.${CSS_CLASSES.SEGMENT_BTN}`);
  buttons.forEach(btn => {
    const btnLevel = parseInt(btn.dataset.level);
    if (btnLevel === level) {
      btn.classList.add(CSS_CLASSES.ACTIVE);
    } else {
      btn.classList.remove(CSS_CLASSES.ACTIVE);
    }
  });
}

// Initialize vulgarity buttons
setupVulgarityButtons();

// Listen for new results from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.EMOJIPASTA_RESULT) {
    lastResultDiv.textContent = message.result;
    resultActionsDiv.style.display = 'flex';
  }
});
