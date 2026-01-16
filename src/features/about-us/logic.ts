import { Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { openLegalURL } from '@/constants/legal';

export const useAboutUsLogic = () => {
  const router = useRouter();

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleContactPress = (type: 'email' | 'website' | 'instagram') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let url = '';
    switch (type) {
      case 'email':
        url = 'mailto:martylazarov99@gmail.com';
        break;
      case 'website':
        url = 'https://lazarovtwins.com';
        break;
      case 'instagram':
        url = 'https://instagram.com/lazarov_twins';
        break;
    }

    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
    });
  };

  const handleLegalPress = (type: 'privacyPolicy' | 'termsOfService' | 'support') => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      openLegalURL(type);
  };

  return {
    handleBack,
    handleContactPress,
    handleLegalPress,
  };
};