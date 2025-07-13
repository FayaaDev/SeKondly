// Configuration for voice-to-text functionality
export const VOICE_CONFIG = {
  // OpenAI API Key - In production, this should be handled more securely
  // You can also pass this from environment variables or secure storage
  OPENAI_API_KEY: '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',
  
  // Whisper API settings
  WHISPER_MODEL: 'whisper-1',
  LANGUAGE: 'en', // Auto-detect if not specified
  
  // Recording settings
  MAX_RECORDING_DURATION: 300, // 5 minutes in seconds
  MIN_RECORDING_DURATION: 1, // 1 second minimum
  
  // Network settings
  API_TIMEOUT: 30000, // 30 seconds timeout
  MAX_RETRIES: 2, // Number of retry attempts
  RETRY_DELAY: 1000, // Delay between retries in milliseconds
};
