/**
 * Utility functions for voice-to-text functionality
 */

/**
 * Formats transcribed text for medical case descriptions
 * - Capitalizes first letter of sentences
 * - Adds proper spacing
 * - Handles common medical abbreviations
 */
export function formatTranscribedText(text: string): string {
  if (!text) return '';
  
  // Clean up the text
  let formatted = text.trim();
  
  // Capitalize first letter of each sentence
  formatted = formatted.replace(/(^|\. )(\w)/g, (match, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
  
  // Handle common medical abbreviations that should be uppercase
  const medicalAbbreviations = [
    'bp', 'hr', 'rr', 'temp', 'ecg', 'ekg', 'ct', 'mri', 'xray', 'x-ray',
    'cbc', 'bun', 'creatinine', 'hb', 'hgb', 'wbc', 'rbc', 'plt',
    'iv', 'po', 'prn', 'bid', 'tid', 'qid', 'qd', 'hs', 'ac', 'pc',
    'copd', 'uti', 'mi', 'chf', 'htn', 'dm', 'dvt', 'pe', 'gi', 'gu'
  ];
  
  medicalAbbreviations.forEach(abbrev => {
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    formatted = formatted.replace(regex, abbrev.toUpperCase());
  });
  
  // Ensure proper ending punctuation
  if (formatted && !formatted.match(/[.!?]$/)) {
    formatted += '.';
  }
  
  return formatted;
}

/**
 * Estimates recording quality based on duration and other factors
 */
export function getRecordingQualityMessage(duration: number): string {
  if (duration < 2) {
    return 'Recording was very short. For better accuracy, try speaking for at least 3-5 seconds.';
  } else if (duration > 120) {
    return 'Long recording detected. Consider breaking into smaller segments for better accuracy.';
  }
  return '';
}

/**
 * Converts seconds to a human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
