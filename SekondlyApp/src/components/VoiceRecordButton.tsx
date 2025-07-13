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

interface VoiceRecordButtonProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  style?: any;
}

export default function VoiceRecordButton({ 
  onTranscriptionComplete, 
  disabled = false,
  style 
}: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording) {
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
      setRecordingDuration(0);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const success = await VoiceService.startRecording();
      if (success) {
        setIsRecording(true);
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
      setIsRecording(false);
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await VoiceService.stopRecording();
      
      if (!result) {
        throw new Error('Failed to complete recording');
      }

      // Show processing feedback for longer recordings
      if (recordingDuration > 10) {
        // For longer recordings, show a more detailed processing message
        console.log('Processing longer recording, this may take a moment...');
      }

      // Transcribe the audio
      const transcription = await VoiceService.transcribeAudio(result.uri);
      
      if (transcription.error) {
        // Provide more specific error handling
        if (transcription.error.includes('timeout') || transcription.error.includes('network')) {
          Alert.alert(
            'Connection Issue', 
            transcription.error + '\n\nTips:\n• Check your internet connection\n• Try a shorter recording\n• Move to an area with better signal',
            [
              { text: 'Try Again', onPress: () => {} },
              { text: 'OK', onPress: () => {} }
            ]
          );
        } else {
          Alert.alert('Transcription Error', transcription.error);
        }
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
      } else {
        Alert.alert(
          'No Speech Detected',
          'No speech was detected in the recording. Please try again and speak more clearly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      let errorMessage = 'Failed to process recording';
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('network')) {
          errorMessage = 'Network connection issue. Please check your internet and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRecording = async () => {
    try {
      await VoiceService.cancelRecording();
      setIsRecording(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  const handlePress = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleLongPress = () => {
    if (isRecording) {
      cancelRecording();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled || isProcessing}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isRecording ? '#FF3B30' : disabled ? '#8E8E93' : '#4ECDC4',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#4ECDC4',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {isProcessing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={20}
              color="white"
            />
          )}
        </Animated.View>
      </TouchableOpacity>
      
      {isRecording && (
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#FF3B30',
          }}>
            Recording...
          </Text>
          <Text style={{
            fontSize: 10,
            color: '#8E8E93',
            marginTop: 2,
          }}>
            {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}
      
      {isProcessing && (
        <Text style={{
          fontSize: 10,
          color: '#4ECDC4',
          marginTop: 6,
          textAlign: 'center',
        }}>
          {recordingDuration > 10 ? 'Processing... This may take a moment' : 'Processing audio...'}
        </Text>
      )}
      
      {!isRecording && !isProcessing && (
        <Text style={{
          fontSize: 9,
          color: '#8E8E93',
          marginTop: 4,
          textAlign: 'center',
          maxWidth: 70,
        }}>
          Tap to record{'\n'}Long press to cancel
        </Text>
      )}
    </View>
  );
}
