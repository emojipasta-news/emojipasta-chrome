// content.js

// Store original text for regeneration
let currentOriginalText = '';
// Track speech synthesis
let currentSpeech = null;

// Message handlers
const messageHandlers = {
  [MESSAGE_TYPES.GET_SELECTED_TEXT]: () => {
    return { selectedText: window.getSelection().toString().trim() };
  },
  [MESSAGE_TYPES.SHOW_NOTIFICATION]: (msg) => {
    showNotification(msg.message, msg.status);
  },
  [MESSAGE_TYPES.SHOW_RESULT]: (msg) => {
    showResultModal(msg.result, msg.originalText);
  },
  [MESSAGE_TYPES.UPDATE_RESULT]: (msg) => {
    updateResultModal(msg.result);
  },
  [MESSAGE_TYPES.REGENERATE_ERROR]: () => {
    handleRegenerateError();
  }
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    const result = handler(message);
    if (result) sendResponse(result);
  }
});

// Show in-page notification
function showNotification(message, status = 'info') {
  // Remove existing notification if any
  const existing = document.getElementById(DOM_IDS.NOTIFICATION);
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.id = DOM_IDS.NOTIFICATION;
  notification.className = `emojipasta-notification ${status}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Generating messages stay until result modal appears
  // Error messages stay for ERROR_DISPLAY_DURATION for visibility
  // Other messages auto-dismiss after SUCCESS_DISPLAY_DURATION
  if (!message.includes('Generating')) {
    const duration = status === 'error' ? ERROR_DISPLAY_DURATION : SUCCESS_DISPLAY_DURATION;
    setTimeout(() => {
      notification.classList.add(CSS_CLASSES.FADE_OUT);
      setTimeout(() => notification.remove(), FADE_DURATION);
    }, duration);
  }
}

// Remove any existing notifications
function removeNotification() {
  const existing = document.getElementById(DOM_IDS.NOTIFICATION);
  if (existing) {
    existing.classList.add(CSS_CLASSES.FADE_OUT);
    setTimeout(() => existing.remove(), FADE_DURATION);
  }
}

// Show result modal with emojipasta
function showResultModal(result, originalText) {
  currentOriginalText = originalText;

  // Remove the "Generating..." notification
  removeNotification();

  // Remove existing modal if any
  const existing = document.getElementById(DOM_IDS.MODAL);
  if (existing) {
    existing.remove();
  }

  // Get current vulgarity level
  chrome.storage.local.get(['vulgarityLevel'], (data) => {
    const currentLevel = data.vulgarityLevel || VULGARITY_LEVELS.DEFAULT;

    const modal = document.createElement('div');
    modal.id = DOM_IDS.MODAL;
    modal.className = 'emojipasta-modal';
    modal.innerHTML = `
      <div class="emojipasta-modal-content">
        <div class="emojipasta-modal-header">
          <h3>🍝 Emojipasta Generated!</h3>
          <button class="emojipasta-close" id="${DOM_IDS.CLOSE}">&times;</button>
        </div>
        <div class="emojipasta-modal-body">
          <div class="emojipasta-result" id="${DOM_IDS.RESULT}">${escapeHtml(result)}</div>
        </div>
        <div class="emojipasta-modal-controls">
          <div class="emojipasta-vulgarity-control">
            <label>Style:</label>
            <div class="segmented-control">
              ${VULGARITY_BUTTONS.map(btn => `
                <button class="segment-btn ${currentLevel === btn.level ? 'active' : ''}" data-level="${btn.level}">${btn.emoji}</button>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="emojipasta-modal-actions">
          <button class="emojipasta-btn emojipasta-btn-primary" id="${DOM_IDS.COPY}">📋 Copy</button>
          <button class="emojipasta-btn emojipasta-btn-primary" id="${DOM_IDS.READ_ALOUD}">🔊 Read</button>
          <button class="emojipasta-btn emojipasta-btn-secondary" id="${DOM_IDS.REGENERATE}">🔄 Regenerate</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById(DOM_IDS.CLOSE).addEventListener('click', closeModal);
    document.getElementById(DOM_IDS.COPY).addEventListener('click', copyResult);
    document.getElementById(DOM_IDS.READ_ALOUD).addEventListener('click', readAloud);
    document.getElementById(DOM_IDS.REGENERATE).addEventListener('click', regenerateEmojipasta);

    // Set up segmented control buttons
    const buttons = modal.querySelectorAll(`.${CSS_CLASSES.SEGMENT_BTN}`);
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const level = parseInt(button.dataset.level);

        // Update active state
        buttons.forEach(btn => btn.classList.remove(CSS_CLASSES.ACTIVE));
        button.classList.add(CSS_CLASSES.ACTIVE);

        // Save to storage
        chrome.storage.local.set({ vulgarityLevel: level });
      });
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  });
}

// Update result in existing modal
function updateResultModal(result) {
  // Remove the "Generating..." notification
  removeNotification();

  const resultDiv = document.getElementById(DOM_IDS.RESULT);
  if (resultDiv) {
    resultDiv.textContent = result;
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById(DOM_IDS.MODAL);
  if (modal) {
    modal.classList.add(CSS_CLASSES.FADE_OUT);
    setTimeout(() => modal.remove(), FADE_DURATION);
  }
}

// Copy result to clipboard
function copyResult() {
  const resultDiv = document.getElementById(DOM_IDS.RESULT);
  if (resultDiv) {
    const text = resultDiv.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const copyBtn = document.getElementById(DOM_IDS.COPY);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, COPY_FEEDBACK_DURATION);
    }).catch((err) => {
      showNotification('Failed to copy to clipboard', 'error');
    });
  }
}

// Read aloud using Web Speech API
function readAloud() {
  const resultDiv = document.getElementById(DOM_IDS.RESULT);
  const readBtn = document.getElementById(DOM_IDS.READ_ALOUD);

  if (!resultDiv || !readBtn) return;

  const text = resultDiv.textContent;

  // If already speaking, stop
  if (currentSpeech && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    currentSpeech = null;
    readBtn.textContent = '🔊 Read';
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
    readBtn.textContent = '🔊 Read';
    currentSpeech = null;
  };

  currentSpeech.onerror = () => {
    readBtn.textContent = '🔊 Read';
    currentSpeech = null;
  };

  window.speechSynthesis.speak(currentSpeech);
}

// Regenerate with new vulgarity level
function regenerateEmojipasta() {
  // Get selected level from active button
  const activeBtn = document.querySelector(`.emojipasta-modal .${CSS_CLASSES.SEGMENT_BTN}.${CSS_CLASSES.ACTIVE}`);
  const newLevel = parseInt(activeBtn.dataset.level);

  // Show loading state in modal result area
  const resultDiv = document.getElementById(DOM_IDS.RESULT);
  const regenerateBtn = document.getElementById(DOM_IDS.REGENERATE);
  const copyBtn = document.getElementById(DOM_IDS.COPY);
  const readBtn = document.getElementById(DOM_IDS.READ_ALOUD);

  if (resultDiv) {
    resultDiv.textContent = 'Generating emojipasta... 🍝';
    resultDiv.classList.add('generating');
  }

  // Disable all action buttons during generation
  regenerateBtn.disabled = true;
  copyBtn.disabled = true;
  readBtn.disabled = true;

  // Send message to background to regenerate
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.REGENERATE_EMOJIPASTA,
    text: currentOriginalText,
    vulgarityLevel: newLevel
  }, (response) => {
    // Re-enable buttons when done (result will be updated via UPDATE_RESULT message)
    regenerateBtn.disabled = false;
    copyBtn.disabled = false;
    readBtn.disabled = false;

    if (resultDiv) {
      resultDiv.classList.remove('generating');
    }
  });
}

// Handle regenerate error
function handleRegenerateError() {
  // Re-enable all buttons
  const regenerateBtn = document.getElementById(DOM_IDS.REGENERATE);
  const copyBtn = document.getElementById(DOM_IDS.COPY);
  const readBtn = document.getElementById(DOM_IDS.READ_ALOUD);
  const resultDiv = document.getElementById(DOM_IDS.RESULT);

  if (regenerateBtn) regenerateBtn.disabled = false;
  if (copyBtn) copyBtn.disabled = false;
  if (readBtn) readBtn.disabled = false;

  // Remove generating class and restore previous result
  if (resultDiv) {
    resultDiv.classList.remove('generating');
    // Error will be shown via notification, so we don't need to change result text
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
