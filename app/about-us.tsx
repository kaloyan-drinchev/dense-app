import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LEGAL_URLS, openLegalURL } from '@/constants/legal';

// Helper function to render text with DENSE and random letters highlighted in green
const renderTextWithHighlight = (text: string, baseStyle: any) => {
  // First, handle DENSE and Lazarov highlighting
  const parts = text.split(/(DENSE|Lazarov)/g);
  
  return parts.map((part, index) => {
    if (part === 'DENSE' || part === 'Lazarov') {
      return (
        <Text key={index} style={[baseStyle, styles.highlightedText]}>
          {part}
        </Text>
      );
    } else if (part.length > 0) {
      // For non-highlighted parts, randomly highlight 2 letters
      return renderRandomHighlights(part, index, baseStyle);
    }
    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  }).flat(); // Flatten the array since renderRandomHighlights returns an array
};

// Helper function to randomly highlight 2 letters in a text part
const renderRandomHighlights = (text: string, partIndex: number, baseStyle: any) => {
  // Get only letters (exclude spaces and punctuation)
  const letters = text.split('').map((char, index) => ({ char, index }))
    .filter(item => /[a-zA-Z]/.test(item.char));
  
  if (letters.length < 2) {
    return [<Text key={`${partIndex}-text`} style={baseStyle}>{text}</Text>]; // Not enough letters to highlight
  }
  
  // Randomly select 2 different letter positions
  const shuffled = [...letters].sort(() => Math.random() - 0.5);
  const highlightIndices = new Set([shuffled[0].index, shuffled[1].index]);
  
  // Render text with highlighted letters
  return text.split('').map((char, index) => {
    if (highlightIndices.has(index)) {
      return (
        <Text key={`${partIndex}-${index}`} style={[baseStyle, styles.highlightedText]}>
          {char}
        </Text>
      );
    }
    return (
      <Text key={`${partIndex}-${index}`} style={baseStyle}>
        {char}
      </Text>
    );
  });
};

export default function AboutUsScreen() {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Icon name="zap" size={64} color={colors.primary} />
          </View>
          <Text style={styles.appName}>DENSE</Text>
          <Text style={styles.tagline}>
            {renderTextWithHighlight(
              "Revolutionary fitness training powered by AI, \n Driven by the Lazarov method.",
              styles.tagline
            )}
          </Text>
        </View>

        {/* Our Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.bodyText}>
            {renderTextWithHighlight(
              "DENSE was born from a simple belief: everyone deserves access to personalized, effective fitness training. Our team combines decades of experience in fitness, technology, and sports science to create the ultimate workout companion.",
              styles.bodyText
            )}
          </Text>
          <Text style={styles.bodyText}>
            {renderTextWithHighlight(
              "We've built this app to bring you the power of AI-driven program generation, ensuring every workout is tailored specifically to your goals, preferences, and progress.",
              styles.bodyText
            )}
          </Text>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet the Team</Text>
          
          <View style={styles.teamMember}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitials}>VL</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameWithIcon}>
                <Text style={styles.memberName}>Vladi Lazarov</Text>
                <Icon name="award" size={20} color="#FFD700" style={styles.goldMedalIcon} />
              </View>
              <Text style={styles.memberRole}>Co-Founder & CFO</Text>
              <Text style={styles.memberDescription}>
                Financial strategist with expertise in business development. 
                Current competitor in Mr. Olympia Open competitions, bringing elite-level training knowledge to our business strategy.
              </Text>
            </View>
          </View>
          <View style={styles.teamMember}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitials}>ML</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameWithIcon}>
                <Text style={styles.memberName}>Marty Lazarov</Text>
                <Icon name="award" size={20} color="#FFD700" style={styles.goldMedalIcon} />
              </View>
              <Text style={styles.memberRole}>Co-Founder & CEO</Text>
              <Text style={styles.memberDescription}>
                Visionary leader with a passion for revolutionizing fitness through technology. 
                Current competitor in Mr. Olympia Open competitions and entrepreneur, dedicated to democratizing elite training worldwide.
              </Text>
            </View>
          </View>

          <View style={styles.teamMember}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitials}>SM</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameWithIcon}>
                <Text style={styles.memberName}>Svetlin Mitev</Text>
                <Icon name="award" size={20} color="#FFD700" style={styles.goldMedalIcon} />
              </View>
              <Text style={styles.memberRole}>Co-Founder, COO & Marketing Director</Text>
              <Text style={styles.memberDescription}>
                Bachelor's in Business Marketing with expertise in digital growth strategies and brand development. 
                Master of viral marketing campaigns, data-driven customer acquisition, and building communities that transform casual users into fitness fanatics.
              </Text>
            </View>
          </View>
          
          <View style={styles.teamMember}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitials}>KD</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameWithIcon}>
                <Text style={styles.memberName}>Kaloyan Drinchev</Text>
                <Icon name="monitor" size={20} color={colors.primary} style={styles.goldMedalIcon} />
              </View>
              <Text style={styles.memberRole}>Co-Founder & CTO</Text>
              <Text style={styles.memberDescription}>
                Senior software engineer with expertise in AI and machine learning. 
                Focused on creating intelligent, user-friendly fitness solutions.
              </Text>
            </View>
          </View>

        </View>

        {/* Mission & Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.bodyText}>
            To democratize elite fitness training through AI technology, making personalized, 
            effective workouts accessible to everyone, anywhere, anytime.
          </Text>

          <View style={styles.valuesList}>
            <View style={styles.valueItem}>
              <Icon name="target" size={20} color={colors.primary} />
              <Text style={styles.valueText}>
                <Text style={styles.valueTitle}>Personalization</Text>
                {'\n'}Every workout tailored to your unique goals and progress
              </Text>
            </View>

            <View style={styles.valueItem}>
              <Icon name="zap" size={20} color={colors.primary} />
              <Text style={styles.valueText}>
                <Text style={styles.valueTitle}>Innovation</Text>
                {'\n'}Cutting-edge AI technology meets proven training methods
              </Text>
            </View>

            <View style={styles.valueItem}>
              <Icon name="users" size={20} color={colors.primary} />
              <Text style={styles.valueText}>
                <Text style={styles.valueTitle}>Accessibility</Text>
                {'\n'}World-class training for everyone, regardless of experience level
              </Text>
            </View>

            <View style={styles.valueItem}>
              <Icon name="award" size={20} color={colors.primary} />
              <Text style={styles.valueText}>
                <Text style={styles.valueTitle}>Excellence</Text>
                {'\n'}Committed to delivering the highest quality fitness experience
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.bodyText}>
            We'd love to hear from you! Whether you have questions, feedback, 
            or just want to say hello, don't hesitate to reach out.
          </Text>

          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress('email')}
            >
              <Icon name="mail" size={20} color={colors.primary} />
              <Text style={styles.contactText}>Mail the CEO</Text>
              <Icon name="external-link" size={16} color={colors.lightGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress('website')}
            >
              <Icon name="globe" size={20} color={colors.primary} />
              <Text style={styles.contactText}>Check our website</Text>
              <Icon name="external-link" size={16} color={colors.lightGray} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress('instagram')}
            >
              <Icon name="instagram" size={20} color={colors.primary} />
              <Text style={styles.contactText}>Lazarov Twins</Text>
              <Icon name="external-link" size={16} color={colors.lightGray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openLegalURL('privacyPolicy')}
          >
            <Icon name="shield" size={20} color={colors.primary} />
            <Text style={styles.contactText}>Privacy Policy</Text>
            <Icon name="external-link" size={16} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openLegalURL('termsOfService')}
          >
            <Icon name="file-text" size={20} color={colors.primary} />
            <Text style={styles.contactText}>Terms of Service</Text>
            <Icon name="external-link" size={16} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openLegalURL('support')}
          >
            <Icon name="help-circle" size={20} color={colors.primary} />
            <Text style={styles.contactText}>Support & Help</Text>
            <Icon name="external-link" size={16} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for the fitness community
          </Text>
          <Text style={styles.footerCopyright}>
            © 2025 DENSE. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    ...typography.h1,
    color: colors.white,
    marginBottom: 8,
  },
  tagline: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },
  bodyText: {
    ...typography.body,
    color: colors.lighterGray,
    lineHeight: 24,
    marginBottom: 16,
  },
  highlightedText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  teamMember: {
    flexDirection: 'row',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  memberNameWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goldMedalIcon: {
    marginLeft: 8,
  },
  memberRole: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  memberDescription: {
    ...typography.bodySmall,
    color: colors.lighterGray,
    lineHeight: 20,
  },
  valuesList: {
    marginTop: 16,
  },
  valueItem: {
    flexDirection: 'row',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  valueText: {
    flex: 1,
    marginLeft: 12,
    ...typography.bodySmall,
    color: colors.lighterGray,
    lineHeight: 20,
  },
  valueTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  contactContainer: {
    marginTop: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    marginLeft: 12,
    ...typography.body,
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.darkGray,
    marginTop: 20,
  },
  footerText: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerCopyright: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
  },
});
