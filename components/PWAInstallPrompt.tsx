import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    // Only run on web
    if (Platform.OS !== 'web') return;

    // Check if app is already installed/standalone
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                               (window.navigator as any).standalone ||
                               document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    // Check if iOS
    const checkIOS = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(ios);
    };

    checkStandalone();
    checkIOS();

    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        if (!isStandalone) {
          setIsVisible(true);
          animateIn();
        }
      }, 5000); // Show after 5 seconds
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show install instructions if not standalone
    if (isIOS && !isStandalone) {
      setTimeout(() => {
        setIsVisible(true);
        animateIn();
      }, 10000); // Show after 10 seconds for iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone, isIOS, onInstall]);

  const animateIn = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const animateOut = (callback?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Edge install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        onInstall?.();
      }
      
      setDeferredPrompt(null);
      handleDismiss();
    } else if (isIOS) {
      // iOS instructions
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    animateOut(() => {
      setIsVisible(false);
      setShowIOSInstructions(false);
      onDismiss?.();
    });
  };

  const handleDismissForever = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    handleDismiss();
  };

  // Don't show if already dismissed permanently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  if (Platform.OS !== 'web' || isStandalone || !isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.promptContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {!showIOSInstructions ? (
            // Main install prompt
            <>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Icon name="smartphone" size={24} color={colors.primary} />
                </View>
                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                  <Icon name="x" size={20} color={colors.lightGray} />
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>Install DENSE App</Text>
              <Text style={styles.description}>
                Get quick access to your workouts and track progress even offline. 
                Add DENSE to your home screen for the best experience!
              </Text>

              <View style={styles.features}>
                <View style={styles.feature}>
                  <Icon name="zap" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>Instant loading</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="wifi-off" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>Works offline</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="bell" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>Push notifications</Text>
                </View>
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity style={styles.installButton} onPress={handleInstall}>
                  <Icon name="download" size={18} color={colors.black} />
                  <Text style={styles.installButtonText}>
                    {isIOS ? 'Show Instructions' : 'Install App'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.dismissButtons}>
                  <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
                    <Text style={styles.dismissButtonText}>Not now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dismissButton} onPress={handleDismissForever}>
                    <Text style={styles.dismissButtonText}>Don't ask again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            // iOS instructions
            <>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Icon name="info" size={24} color={colors.primary} />
                </View>
                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                  <Icon name="x" size={20} color={colors.lightGray} />
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>Install on iPhone/iPad</Text>
              <Text style={styles.description}>
                Follow these steps to add DENSE to your home screen:
              </Text>

              <View style={styles.instructions}>
                <View style={styles.instruction}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Icon name="share" size={18} color={colors.primary} />
                    <Text style={styles.instructionText}>
                      Tap the Share button in Safari
                    </Text>
                  </View>
                </View>

                <View style={styles.instruction}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Icon name="plus-square" size={18} color={colors.primary} />
                    <Text style={styles.instructionText}>
                      Select "Add to Home Screen"
                    </Text>
                  </View>
                </View>

                <View style={styles.instruction}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Icon name="check" size={18} color={colors.primary} />
                    <Text style={styles.instructionText}>
                      Tap "Add" to confirm
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.gotItButton} onPress={handleDismiss}>
                <Text style={styles.gotItButtonText}>Got it!</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  promptContainer: {
    backgroundColor: colors.darkGray,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.lightGray,
    lineHeight: 24,
    marginBottom: 20,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.white,
  },
  buttons: {
    gap: 16,
  },
  installButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  installButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
  },
  dismissButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dismissButton: {
    padding: 12,
  },
  dismissButtonText: {
    fontSize: 14,
    color: colors.lightGray,
  },
  instructions: {
    marginBottom: 24,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.black,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.white,
    flex: 1,
  },
  gotItButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gotItButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
  },
});
