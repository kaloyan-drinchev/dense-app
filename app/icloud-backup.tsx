import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';

export default function ICloudBackupScreen() {
  const router = useRouter();
  const { createCloudAccount, backupToCloud, checkCloudStatus } = useAuthStore();
  const [cloudEmail, setCloudEmail] = useState('');
  const [isCloudProcessing, setIsCloudProcessing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleCreateCloudAccount = async () => {
    if (!cloudEmail.trim()) {
      Alert.alert('Error', 'Please enter your iCloud email address');
      return;
    }

    if (!cloudEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsCloudProcessing(true);
    try {
      await createCloudAccount(cloudEmail);
      Alert.alert(
        'Success!', 
        'iCloud backup account created successfully. Your workout data will be automatically backed up.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating cloud account:', error);
      Alert.alert('Error', 'Failed to create iCloud backup account. Please try again.');
    } finally {
      setIsCloudProcessing(false);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await backupToCloud();
      Alert.alert('Success!', 'Your workout data has been backed up to iCloud.');
    } catch (error) {
      console.error('Error backing up:', error);
      Alert.alert('Error', 'Failed to backup data. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>iCloud Backup</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.iconContainer}>
              <Icon name="cloud" size={48} color={colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Protect Your Progress</Text>
            <Text style={styles.welcomeDescription}>
              Never lose your workout data again. Setup iCloud backup to keep your progress safe and synced across all your devices.
            </Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Why Backup?</Text>
            <View style={styles.benefitItem}>
              <Icon name="shield" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Protect against data loss</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="smartphone" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Sync across all devices</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="refresh-cw" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Automatic backups</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="lock" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Secure and private</Text>
            </View>
          </View>

          {/* Setup Section */}
          <View style={styles.setupSection}>
            <Text style={styles.sectionTitle}>Setup iCloud Backup</Text>
            <Text style={styles.sectionDescription}>
              Enter your iCloud email address to create a backup account. Your workout data will be automatically synced.
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your iCloud email address"
                placeholderTextColor={colors.lightGray}
                value={cloudEmail}
                onChangeText={setCloudEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.setupButton, isCloudProcessing && styles.setupButtonDisabled]}
              onPress={handleCreateCloudAccount}
              disabled={isCloudProcessing}
              activeOpacity={1}
            >
              {isCloudProcessing ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <>
                  <Icon name="cloud" size={20} color={colors.black} />
                  <Text style={styles.setupButtonText}>Setup iCloud Backup</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Manual Backup Section */}
          <View style={styles.manualBackupSection}>
            <Text style={styles.sectionTitle}>Manual Backup</Text>
            <Text style={styles.sectionDescription}>
              Already have iCloud backup setup? You can manually backup your data now.
            </Text>
            
            <TouchableOpacity
              style={[styles.backupButton, isBackingUp && styles.backupButtonDisabled]}
              onPress={handleBackupNow}
              disabled={isBackingUp}
              activeOpacity={1}
            >
              {isBackingUp ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Icon name="upload" size={20} color={colors.white} />
                  <Text style={styles.backupButtonText}>Backup Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Icon name="info" size={16} color={colors.lightGray} />
              <Text style={styles.infoText}>
                Your data is encrypted and stored securely in your iCloud account
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="info" size={16} color={colors.lightGray} />
              <Text style={styles.infoText}>
                Backups happen automatically when you complete workouts
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    flex: 1,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  benefitsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    ...typography.body,
    color: colors.white,
    marginLeft: 12,
  },
  setupSection: {
    marginBottom: 40,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: 20,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  emailInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  setupButtonDisabled: {
    opacity: 0.6,
  },
  setupButtonText: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
  manualBackupSection: {
    marginBottom: 40,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mediumGray,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  backupButtonDisabled: {
    opacity: 0.6,
  },
  backupButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
