import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PendingVerificationScreenProps {
  onCheckStatus: () => void;
  userEmail?: string;
}

/**
 * PendingVerificationScreen - Screen shown when user account is under review
 * 
 * This screen is displayed to users whose accounts are being reviewed
 * by the medical verification team after completing onboarding.
 * 
 * Features:
 * - iOS-native design
 * - Clear status messaging
 * - Check status action
 * - Professional medical theming
 * 
 * @param onCheckStatus - Callback when user wants to check their verification status
 * @param userEmail - Optional user email to display
 * 
 * @example
 * ```tsx
 * <PendingVerificationScreen
 *   onCheckStatus={() => checkVerificationStatus()}
 *   userEmail="doctor@example.com"
 * />
 * ```
 */
const PendingVerificationScreen: React.FC<PendingVerificationScreenProps> = ({
  onCheckStatus,
  userEmail,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={80} color="#FF9500" />
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>Account Under Review</Text>
        
        <Text style={styles.description}>
          Your medical credentials are being reviewed by our verification team. 
          This process typically takes 1-2 business days.
        </Text>

        {userEmail && (
          <Text style={styles.emailText}>
            We'll send an email to {userEmail} once your account is approved.
          </Text>
        )}

        {/* Information Cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="document-text-outline" size={24} color="#007AFF" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Credentials Submitted</Text>
              <Text style={styles.infoSubtitle}>Your documents are being reviewed</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#34C759" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Secure Process</Text>
              <Text style={styles.infoSubtitle}>Your information is protected</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="notifications-outline" size={24} color="#FF9500" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Email Notification</Text>
              <Text style={styles.infoSubtitle}>You'll be notified when approved</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.checkButton} onPress={onCheckStatus}>
          <Text style={styles.checkButtonText}>Check Status</Text>
        </TouchableOpacity>

        {/* Support Text */}
        <Text style={styles.supportText}>
          Need help? Contact our support team at{' '}
          <Text style={styles.supportLink}>support@medconnect.com</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    backgroundColor: '#FFF3CD',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emailText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  supportText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  supportLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
} as const;

export default PendingVerificationScreen;
