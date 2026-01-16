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
import { subscriptionService } from '@/services/subscription';
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
    // Note: The new RevenueCat service doesn't support provider switching
    // Always use RevenueCat (which handles both Apple and Google payments)
    setProviderInfo({
      provider: 'revenuecat',
      displayName: 'RevenueCat (Apple/Google IAP)'
    });
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
    // Payment provider switching is not supported with RevenueCat
    Alert.alert(
      'Not Supported',
      'Payment provider switching is not available. The app now uses RevenueCat which automatically handles Apple and Google payments.',
      [{ text: 'OK' }]
    );
  };

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
            {providerInfo?.displayName || 'RevenueCat'}
          </Text>
        </View>

        {/* Info about RevenueCat */}
        <View style={styles.infoContainer}>
          <Icon name="info" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            The app now uses RevenueCat which automatically handles payments through Apple App Store (iOS) and Google Play Store (Android). Payment provider switching is no longer needed.
          </Text>
        </View>
      </View>
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
