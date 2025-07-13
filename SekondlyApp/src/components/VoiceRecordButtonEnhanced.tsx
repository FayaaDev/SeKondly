import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import VoiceService from '../services/voiceService';
import { VOICE_CONFIG } from '../config/voice';
import { formatTranscribedText, getRecordingQualityMessage } from '../utils/voiceUtils';

interface VoiceRecordButtonEnhancedProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  style?: any;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'saved' | 'playing';

export default function VoiceRecordButtonEnhanced({ 
  onTranscriptionComplete, 
  disabled = false,
  style 
}: VoiceRecordButtonEnhancedProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [savedRecordingUri, setSavedRecordingUri] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation for recording state
  useEffect(() => {
    if (recordingState === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Start duration counter
      const startTime = Date.now();
      durationInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
        
        // Auto-stop if max duration reached
        if (elapsed >= VOICE_CONFIG.MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 1000);

      return () => {
        pulse.stop();
        if (durationInterval.current) {
          clearInterval(durationInterval.current);
        }
      };
    } else {
      if (recordingState === 'idle') {
        setRecordingDuration(0);
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
  }, [recordingState, pulseAnim]);

  const startRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const success = await VoiceService.startRecording();
      if (success) {
        setRecordingState('recording');
        setLastError(null);
        setSavedRecordingUri(null);
      } else {
        Alert.alert(
          'Recording Failed',
          'Unable to start voice recording. Please check microphone permissions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setRecordingState('processing');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await VoiceService.stopRecording();
      
      if (!result) {
        throw new Error('Failed to complete recording');
      }

      // Save the recording URI for potential replay/resubmit
      setSavedRecordingUri(result.savedUri || result.uri);
      setRecordingState('saved');

      // Set to saved state to show action buttons
      setRecordingState('saved');
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingState('idle');
      Alert.alert('Error', 'Failed to process recording');
    }
  };

  const useRecording = async () => {
    if (!savedRecordingUri) return;
    await attemptTranscription(savedRecordingUri);
  };

  const attemptTranscription = async (audioUri: string) => {
    try {
      setRecordingState('processing');
      
      // Transcribe the audio
      const transcription = await VoiceService.transcribeAudio(audioUri);
      
      if (transcription.error) {
        setLastError(transcription.error);
        setRecordingState('saved');
        return;
      }

      if (transcription.text.trim()) {
        const formattedText = formatTranscribedText(transcription.text.trim());
        onTranscriptionComplete(formattedText);
        
        // Show quality message if applicable
        const qualityMessage = getRecordingQualityMessage(recordingDuration);
        if (qualityMessage) {
          setTimeout(() => {
            Alert.alert('Recording Tip', qualityMessage, [{ text: 'OK' }]);
          }, 500);
        }
        
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Reset to idle state after successful transcription
        resetToIdle();
      } else {
        setRecordingState('saved');
        Alert.alert(
          'No Speech Detected',
          'No speech was detected in the recording. You can replay it or try recording again.',
          [
            { text: 'Play Recording', onPress: playRecording },
            { text: 'Use Anyway', onPress: () => onTranscriptionComplete('') },
            { text: 'Record Again', onPress: resetToIdle },
          ]
        );
      }
    } catch (error) {
      console.error('Error during transcription:', error);
      setRecordingState('saved');
      setLastError('Transcription failed');
    }
  };

  // Removed showTranscriptionFailedDialog - now using inline buttons

  const playRecording = async () => {
    if (!savedRecordingUri) return;
    
    try {
      setRecordingState('playing');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await VoiceService.playRecording(savedRecordingUri);
      
      // Reset to saved state after a delay (assuming playback duration)
      setTimeout(() => {
        if (recordingState === 'playing') {
          setRecordingState('saved');
        }
      }, Math.max(recordingDuration * 1000, 2000));
      
    } catch (error) {
      console.error('Error playing recording:', error);
      setRecordingState('saved');
      Alert.alert('Playback Error', 'Failed to play the recording');
    }
  };

  const stopPlayback = async () => {
    try {
      await VoiceService.stopPlayback();
      setRecordingState('saved');
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const resetToIdle = async () => {
    if (savedRecordingUri) {
      // Clean up the saved recording
      await VoiceService.deleteRecording(savedRecordingUri);
    }
    VoiceService.clearCurrentRecording();
    setSavedRecordingUri(null);
    setLastError(null);
    setRecordingState('idle');
    setRecordingDuration(0);
  };

  const cancelRecording = async () => {
    try {
      await VoiceService.cancelRecording();
      setRecordingState('idle');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  const handleMainButtonPress = () => {
    if (disabled) return;
    
    switch (recordingState) {
      case 'idle':
        startRecording();
        break;
      case 'recording':
        stopRecording();
        break;
      case 'playing':
        stopPlayback();
        break;
      case 'saved':
        // In saved state, the smaller record button starts a new recording
        resetToIdle();
        startRecording();
        break;
    }
  };

  // Removed showSavedRecordingOptionsDialog - now using inline buttons

  const handleLongPress = () => {
    if (recordingState === 'recording') {
      cancelRecording();
    } else if (recordingState === 'saved') {
      resetToIdle();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonColor = (): string => {
    switch (recordingState) {
      case 'recording': return '#FF3B30';
      case 'saved': return '#FF9500';
      case 'playing': return '#34C759';
      case 'processing': return '#8E8E93';
      default: return disabled ? '#8E8E93' : '#4ECDC4';
    }
  };

  const getButtonIcon = (): string => {
    switch (recordingState) {
      case 'recording': return 'stop';
      case 'saved': return 'ellipsis-horizontal';
      case 'playing': return 'pause';
      default: return 'mic';
    }
  };

  const getStatusText = (): string => {
    switch (recordingState) {
      case 'recording': return 'Recording...';
      case 'processing': return recordingDuration > 10 ? 'Processing... This may take a moment' : 'Processing audio...';
      case 'saved': return 'Choose an action';
      case 'playing': return 'Playing recording...';
      default: return 'Tap to record';
    }
  };

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      {recordingState === 'saved' || recordingState === 'playing' ? (
        // Show action buttons when recording is saved or playing
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Record button (smaller when showing actions) */}
          <TouchableOpacity
            onPress={handleMainButtonPress}
            disabled={disabled}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: getButtonColor(),
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: getButtonColor(),
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Ionicons
              name={getButtonIcon() as any}
              size={16}
              color="white"
            />
          </TouchableOpacity>

          {/* Action buttons */}
          <TouchableOpacity
            onPress={useRecording}
            disabled={false}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: '#007AFF',
              minWidth: 50,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              Use
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playRecording}
            disabled={recordingState === 'playing'}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: recordingState === 'playing' ? '#FF9500' : '#34C759',
              minWidth: 50,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              {recordingState === 'playing' ? 'Playing' : 'Replay'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetToIdle}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: '#FF3B30',
              minWidth: 50,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      ) : recordingState === 'processing' ? (
        // Show processing state
        <TouchableOpacity
          disabled={true}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: getButtonColor(),
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: getButtonColor(),
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <ActivityIndicator color="white" size="small" />
        </TouchableOpacity>
      ) : (
        // Show normal record button
        <TouchableOpacity
          onPress={handleMainButtonPress}
          onLongPress={handleLongPress}
          disabled={disabled}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: getButtonColor(),
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: getButtonColor(),
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Animated.View style={{ transform: [{ scale: recordingState === 'recording' ? pulseAnim : 1 }] }}>
            <Ionicons
              name={getButtonIcon() as any}
              size={20}
              color="white"
            />
          </Animated.View>
        </TouchableOpacity>
      )}
      
      <View style={{ marginTop: 8, alignItems: 'center', minHeight: 40 }}>
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: getButtonColor(),
        }}>
          {getStatusText()}
        </Text>
        
        {(recordingState === 'recording' || recordingState === 'saved' || recordingState === 'playing') && (
          <Text style={{
            fontSize: 10,
            color: '#8E8E93',
            marginTop: 2,
          }}>
            {formatDuration(recordingDuration)}
          </Text>
        )}
        
        {lastError && (recordingState === 'saved' || recordingState === 'playing') && (
          <Text style={{
            fontSize: 9,
            color: '#FF3B30',
            marginTop: 2,
            textAlign: 'center',
            maxWidth: 120,
          }}>
            Previous attempt failed
          </Text>
        )}
      </View>
      
      {recordingState === 'idle' && (
        <Text style={{
          fontSize: 9,
          color: '#8E8E93',
          marginTop: 4,
          textAlign: 'center',
          maxWidth: 70,
        }}>
          Long press to cancel
        </Text>
      )}
    </View>
  );
}
