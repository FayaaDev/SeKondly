import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import OpenAI from 'openai';
import { VOICE_CONFIG } from '../config/voice';
import * as FileSystem from 'expo-file-system';

interface VoiceRecordingResult {
  uri: string;
  duration: number;
  savedUri?: string; // Permanently saved audio file
}

interface VoiceTranscriptionResult {
  text: string;
  error?: string;
}

interface SavedRecording {
  uri: string;
  duration: number;
  timestamp: number;
  transcribed: boolean;
}

class VoiceService {
  private recording: Audio.Recording | null = null;
  private openai: OpenAI | null = null;
  private currentSavedRecording: SavedRecording | null = null;

  constructor() {
    // Initialize OpenAI with API key - we'll get this from environment or config
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    try {
      this.openai = new OpenAI({
        apiKey: VOICE_CONFIG.OPENAI_API_KEY,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<VoiceRecordingResult | null> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      this.recording = null;

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      const duration = status.durationMillis || 0;

      // Save the recording permanently
      const savedUri = await this.saveRecordingPermanently(uri);
      
      // Store reference to the current recording
      this.currentSavedRecording = {
        uri: savedUri,
        duration,
        timestamp: Date.now(),
        transcribed: false,
      };

      return {
        uri: savedUri,
        duration,
        savedUri,
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  private async saveRecordingPermanently(tempUri: string): Promise<string> {
    try {
      // Create a permanent file path in the document directory
      const documentsDir = FileSystem.documentDirectory;
      const fileName = `voice_recording_${Date.now()}.m4a`;
      const permanentUri = `${documentsDir}${fileName}`;

      // Copy the temporary recording to permanent storage
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri,
      });

      console.log('Recording saved permanently to:', permanentUri);
      return permanentUri;
    } catch (error) {
      console.error('Failed to save recording permanently:', error);
      // If saving fails, return the original URI
      return tempUri;
    }
  }

  async transcribeAudio(audioUri: string): Promise<VoiceTranscriptionResult> {
    let lastError: Error | null = null;
    
    // Try the transcription with retries
    for (let attempt = 1; attempt <= VOICE_CONFIG.MAX_RETRIES + 1; attempt++) {
      try {
        if (!this.openai) {
          return {
            text: '',
            error: 'OpenAI not initialized. Please check your API key configuration.',
          };
        }

        console.log(`Transcription attempt ${attempt}/${VOICE_CONFIG.MAX_RETRIES + 1}`);

        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timed out after 30 seconds'));
          }, VOICE_CONFIG.API_TIMEOUT);
        });

        // Create the actual API request promise
        const apiRequestPromise = this.makeTranscriptionRequest(audioUri);

        // Race between the API request and timeout
        const response = await Promise.race([apiRequestPromise, timeoutPromise]);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Unknown error';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
        }

        const data = await response.json();
        
        // Mark the current recording as transcribed
        if (this.currentSavedRecording && this.currentSavedRecording.uri === audioUri) {
          this.currentSavedRecording.transcribed = true;
        }
        
        return {
          text: data.text || '',
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        console.error(`Transcription attempt ${attempt} failed:`, lastError.message);
        
        // If this is the last attempt, don't wait
        if (attempt < VOICE_CONFIG.MAX_RETRIES + 1) {
          console.log(`Retrying in ${VOICE_CONFIG.RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, VOICE_CONFIG.RETRY_DELAY));
        }
      }
    }

    // All attempts failed
    return {
      text: '',
      error: this.getUserFriendlyErrorMessage(lastError),
    };
  }

  async playRecording(audioUri: string): Promise<void> {
    try {
      console.log('Playing recording:', audioUri);
      
      // Stop any currently playing audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      // The sound will start playing automatically
      // You can add a callback to know when it finishes if needed
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Playback finished');
          sound.unloadAsync();
        }
      });
      
    } catch (error) {
      console.error('Failed to play recording:', error);
      throw new Error('Failed to play recording');
    }
  }

  async stopPlayback(): Promise<void> {
    try {
      // This will stop all currently playing audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  getCurrentSavedRecording(): SavedRecording | null {
    return this.currentSavedRecording;
  }

  async resubmitLastRecording(): Promise<VoiceTranscriptionResult> {
    if (!this.currentSavedRecording) {
      return {
        text: '',
        error: 'No recording available to resubmit',
      };
    }

    return this.transcribeAudio(this.currentSavedRecording.uri);
  }

  async deleteRecording(audioUri: string): Promise<void> {
    try {
      // Check if file exists before attempting to delete
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(audioUri);
        console.log('Recording deleted:', audioUri);
      }
      
      // Clear current saved recording if it matches
      if (this.currentSavedRecording && this.currentSavedRecording.uri === audioUri) {
        this.currentSavedRecording = null;
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  }

  clearCurrentRecording(): void {
    this.currentSavedRecording = null;
  }

  private async makeTranscriptionRequest(audioUri: string): Promise<Response> {
    // Create FormData for the API request
    const formData = new FormData();
    
    // Add the audio file
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    
    formData.append('model', VOICE_CONFIG.WHISPER_MODEL);
    formData.append('language', VOICE_CONFIG.LANGUAGE);

    // Make the API call to OpenAI Whisper
    return fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOICE_CONFIG.OPENAI_API_KEY}`,
        // Don't set Content-Type for FormData - let the browser set it with boundary
      },
      body: formData,
    });
  }

  private getUserFriendlyErrorMessage(error: Error | null): string {
    if (!error) return 'Failed to transcribe audio';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Request timed out. Please check your internet connection and try a shorter recording.';
    } else if (message.includes('network')) {
      return 'Network error. Please check your internet connection and try again.';
    } else if (message.includes('unauthorized') || message.includes('401')) {
      return 'API authentication failed. Please check your OpenAI API key.';
    } else if (message.includes('rate limit') || message.includes('429')) {
      return 'API rate limit exceeded. Please wait a moment and try again.';
    } else if (message.includes('file') || message.includes('format')) {
      return 'Audio file format not supported. Please try recording again.';
    } else {
      return `Transcription failed: ${error.message}`;
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  }

  isRecording(): boolean {
    return this.recording !== null;
  }
}

export default new VoiceService();
