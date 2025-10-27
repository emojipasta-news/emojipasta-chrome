// constants.js - Shared constants across the extension
// Note: Using var for global scope compatibility in content scripts

// Text validation limits
var MIN_CHARS = 100;
var MAX_CHARS = 1000;
var LETTER_REGEX = /[a-zA-Z]/;

// Vulgarity levels
var VULGARITY_LEVELS = {
  TRUMP: 0,
  MILD: 1,
  EDGY: 5,
  VULGAR: 10,
  DEFAULT: 5
};
var DEFAULT_VULGARITY_LEVEL = VULGARITY_LEVELS.DEFAULT;

// Vulgarity level buttons configuration (emoji and level mapping)
var VULGARITY_BUTTONS = [
  { level: 0, emoji: '🇺🇸', label: 'Trump tweet' },
  { level: 5, emoji: '🔥😏', label: 'Edgy' },
  { level: 10, emoji: '🍆💦 🫦', label: 'Vulgar' }
];

// Timing (milliseconds)
var FADE_DURATION = 300;
var COPY_FEEDBACK_DURATION = 2000;
var ERROR_DISPLAY_DURATION = 8000;
var SUCCESS_DISPLAY_DURATION = 3000;

// API configuration
var API_KEY_PREFIX = 'sk-';
var MODEL_OPTIONS = {
  MINI: 'gpt-4o-mini',
  STANDARD: 'gpt-4o',
  DEFAULT: 'gpt-4o-mini'
};
var OPENAI_MAX_TOKENS = 1024;
var OPENAI_TEMPERATURE = 1.2;

// DOM element IDs
var DOM_IDS = {
  NOTIFICATION: 'emojipasta-notification',
  MODAL: 'emojipasta-modal',
  RESULT: 'emojipasta-result',
  CLOSE: 'emojipasta-close',
  COPY: 'emojipasta-copy',
  REGENERATE: 'emojipasta-regenerate',
  READ_ALOUD: 'emojipasta-read-aloud'
};

// CSS class names
var CSS_CLASSES = {
  SEGMENT_BTN: 'segment-btn',
  ACTIVE: 'active',
  INVALID: 'invalid',
  FADE_OUT: 'fade-out'
};

// Message types
var MESSAGE_TYPES = {
  GET_SELECTED_TEXT: 'get-selected-text',
  SHOW_NOTIFICATION: 'show-notification',
  SHOW_RESULT: 'show-result',
  UPDATE_RESULT: 'update-result',
  REGENERATE_EMOJIPASTA: 'regenerate-emojipasta',
  REGENERATE_ERROR: 'regenerate-error',
  EMOJIPASTA_RESULT: 'emojipasta-result'
};
