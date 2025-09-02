import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { subscriptionService } from '@/services/subscription-service';
import { paymentConfig } from '@/services/payment-config';
import * as Haptics from 'expo-haptics';

interface PaymentProviderSwitcherProps {
  onProviderChange?: (provider: 'mock' | 'apple') => void;
}

export const PaymentProviderSwitcher: React.FC<PaymentProviderSwitcherProps> = ({ 
  onProviderChange 
}) => {
  const [currentProvider, setCurrentProvider] = useState<'mock' | 'apple'>('mock');
  const [providerInfo, setProviderInfo] = useState<{
    provider: string;
    displayName: string;
  } | null>(null);

  // Load current provider information
  useEffect(() => {
    const loadProviderInfo = () => {
      try {
        const info = subscriptionService.getPaymentProviderInfo();
        setProviderInfo(info);
        setCurrentProvider(info.provider as 'mock' | 'apple');
      } catch (error) {
        console.error('❌ Error loading payment provider info:', error);
      }
    };

    loadProviderInfo();
  }, []);

  const handleProviderSwitch = (useApple: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newProvider = useApple ? 'apple' : 'mock';

    try {
      // Show confirmation for Apple payments
      if (newProvider === 'apple') {
        Alert.alert(
          '🍎 Switch to Apple Payments?',
          'This will enable real Apple In-App Purchases. You will be charged for any subscriptions purchased.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable Apple IAP',
              style: 'default',
              onPress: () => {
                switchProvider(newProvider);
              },
            },
          ]
        );
      } else {
        // Switch to mock payments without confirmation
        switchProvider(newProvider);
      }
    } catch (error) {
      console.error('❌ Error switching payment provider:', error);
      Alert.alert('Error', 'Failed to switch payment provider');
    }
  };

  const switchProvider = (provider: 'mock' | 'apple') => {
    try {
      subscriptionService.switchPaymentProvider(provider);
      setCurrentProvider(provider);
      
      const newInfo = subscriptionService.getPaymentProviderInfo();
      setProviderInfo(newInfo);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Notify parent component
      onProviderChange?.(provider);

      Alert.alert(
        'Payment Provider Changed',
        `Switched to ${newInfo.displayName}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Error switching payment provider:', error);
      Alert.alert('Error', 'Failed to switch payment provider');
    }
  };

  // Don't show on web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.infoContainer}>
          <Icon name="info" size={16} color={colors.lightGray} />
          <Text style={styles.infoText}>
            Payment provider switching not available on web
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="credit-card" size={20} color={colors.white} />
        <Text style={styles.title}>Payment Provider</Text>
      </View>

      <View style={styles.content}>
        {/* Current Provider Info */}
        <View style={styles.currentProvider}>
          <Text style={styles.label}>Current Provider:</Text>
          <Text style={styles.providerName}>
            {providerInfo?.displayName || 'Unknown'}
          </Text>
        </View>

        {/* Provider Switch */}
        <View style={styles.switchContainer}>
          <View style={styles.switchOption}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, currentProvider === 'mock' && styles.activeLabel]}>
                Mock Payments
              </Text>
              <Text style={styles.switchDescription}>
                Development/Testing mode
              </Text>
            </View>
          </View>

          <Switch
            trackColor={{ false: colors.darkGray, true: colors.primary }}
            thumbColor={currentProvider === 'apple' ? colors.white : colors.lightGray}
            onValueChange={handleProviderSwitch}
            value={currentProvider === 'apple'}
            style={styles.switch}
          />

          <View style={styles.switchOption}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, currentProvider === 'apple' && styles.activeLabel]}>
                Apple In-App Purchases
              </Text>
              <Text style={styles.switchDescription}>
                Real payments (iOS only)
              </Text>
            </View>
          </View>
        </View>

        {/* Warning for Apple payments */}
        {currentProvider === 'apple' && (
          <View style={styles.warningContainer}>
            <Icon name="alert-triangle" size={16} color={colors.warning} />
            <Text style={styles.warningText}>
              Apple IAP enabled - Real charges will occur
            </Text>
          </View>
        )}

        {/* Info for mock payments */}
        {currentProvider === 'mock' && (
          <View style={styles.infoContainer}>
            <Icon name="info" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Mock payments enabled - No actual charges
            </Text>
          </View>
        )}
      </View>

      {/* Platform availability notice */}
      {Platform.OS !== 'ios' && (
        <View style={styles.platformNotice}>
          <Text style={styles.platformNoticeText}>
            Apple In-App Purchases only available on iOS devices
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    ...typography.h4,
    color: colors.white,
    marginLeft: 8,
  },
  content: {
    gap: 12,
  },
  currentProvider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  label: {
    ...typography.body,
    color: colors.lightGray,
  },
  providerName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchOption: {
    flex: 1,
  },
  switchInfo: {
    alignItems: 'flex-start',
  },
  switchLabel: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontWeight: '500',
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  switchDescription: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 2,
  },
  switch: {
    marginHorizontal: 16,
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  infoText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: 8,
    flex: 1,
  },
  platformNotice: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.mediumGray,
    borderRadius: 6,
  },
  platformNoticeText: {
    ...typography.caption,
    color: colors.lightGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
