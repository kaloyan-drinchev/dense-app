import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

interface RevenueCatMigrationModalProps {
  visible: boolean;
  onMigrate: () => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}

const RevenueCatMigrationModal: React.FC<RevenueCatMigrationModalProps> = ({
  visible,
  onMigrate,
  onSkip,
  onClose,
}) => {
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      await onMigrate();
    } catch (error) {
      console.error('Migration failed:', error);
      Alert.alert(
        'Migration Failed',
        'There was an issue upgrading your subscription. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Upgrade?',
      'You can upgrade to the new subscription system later in Settings. Your current subscription will continue to work.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip for now', onPress: onSkip }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <LinearGradient
        colors={[colors.background, colors.darkGray]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={isMigrating}
              activeOpacity={0.7}
            >
              <Icon name="x" size={24} color={colors.lightGray} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: colors.primary }]}>
                <Icon name="shield-check" size={32} color={colors.black} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Subscription Upgrade Available</Text>
            
            {/* Description */}
            <Text style={styles.description}>
              We've upgraded to a more secure subscription system powered by RevenueCat. 
              This provides better security, cross-device sync, and improved purchase restoration.
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Enhanced security & fraud protection</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Seamless cross-device subscription sync</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Improved purchase restoration</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Better subscription management</Text>
              </View>
            </View>

            {/* Notice */}
            <View style={styles.noticeContainer}>
              <Icon name="info" size={16} color={colors.warning} />
              <Text style={styles.noticeText}>
                Your current subscription will remain active. This upgrade is free and optional.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, isMigrating && styles.primaryButtonDisabled]}
              onPress={handleMigrate}
              disabled={isMigrating}
              activeOpacity={0.8}
            >
              {isMigrating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.black} />
                  <Text style={styles.primaryButtonText}>Upgrading...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Upgrade Now (Recommended)</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSkip}
              disabled={isMigrating}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  benefitText: {
    ...typography.body,
    color: colors.lightGray,
    marginLeft: 12,
    flex: 1,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.darkGray,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    alignSelf: 'stretch',
  },
  noticeText: {
    ...typography.small,
    color: colors.lightGray,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    paddingTop: 20,
    paddingBottom: 10,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.black,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.lightGray,
  },
});

export default RevenueCatMigrationModal;

