import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SubscriptionReminderModalProps {
  visible: boolean;
  daysRemaining: number;
  onRenew: () => void;
  onCancel: () => void;
}

export const SubscriptionReminderModal: React.FC<SubscriptionReminderModalProps> = ({
  visible,
  daysRemaining,
  onRenew,
  onCancel,
}) => {
  const handleRenew = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRenew();
  };

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCancel();
  };

  const getDaysText = () => {
    if (daysRemaining === 0) {
      return <Text style={styles.messageText}>Your subscription expires today!</Text>;
    } else if (daysRemaining === 1) {
      return <Text style={styles.messageText}>Your subscription expires in 1 day!</Text>;
    } else {
      return <Text style={styles.messageText}>Your subscription expires in {daysRemaining} days!</Text>;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={gradients.card as [string, string, ...string[]]}
            style={styles.modalContent}
          >
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <Icon name="alert-circle" size={48} color={colors.warning} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Subscription Cancelled</Text>

            {/* Message */}
            <View style={styles.messageContainer}>
              {getDaysText()}
              <Text style={styles.subMessage}>
                <Text>Renew now to continue enjoying unlimited AI-generated workouts and premium features.</Text>
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.renewButtonContainer}
                onPress={handleRenew}
              >
                <LinearGradient
                  colors={gradients.primaryButton as [string, string, ...string[]]}
                  style={styles.renewButton}
                >
                  <Icon name="zap" size={20} color={colors.black} />
                  <Text style={styles.renewButtonText}>Renew Subscription</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  messageText: {
    ...typography.h4,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  renewButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  renewButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.lightGray,
  },
});
