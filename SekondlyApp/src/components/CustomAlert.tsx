import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons: CustomAlertButton[];
  onRequestClose?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  icon = 'information-circle',
  iconColor = '#4ECDC4',
  buttons,
  onRequestClose,
}: CustomAlertProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name={icon} size={32} color={iconColor} />
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.cancelButton,
                  button.style === 'destructive' && styles.destructiveButton,
                  buttons.length === 1 && styles.singleButton,
                ]}
                onPress={button.onPress}
              >
                <Text style={[
                  styles.buttonText,
                  button.style === 'cancel' && styles.cancelButtonText,
                  button.style === 'destructive' && styles.destructiveButtonText,
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Hook for easy usage similar to Alert.alert
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    buttons: CustomAlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: CustomAlertButton[] = [{ text: 'OK', onPress: () => hideAlert() }],
    icon?: keyof typeof Ionicons.glyphMap,
    iconColor?: string
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons.map(button => ({
        ...button,
        onPress: () => {
          button.onPress();
          hideAlert();
        },
      })),
      icon,
      iconColor,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      {...alertConfig}
      onRequestClose={hideAlert}
    />
  );

  return { showAlert, AlertComponent };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  singleButton: {
    // No additional styles needed for single button
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#1C1C1E',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});
