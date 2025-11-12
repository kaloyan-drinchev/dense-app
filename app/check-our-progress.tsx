import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { HomepageVideoModal } from '@/components/HomepageVideoModal';

export default function CheckOurProgressScreen() {
  const router = useRouter();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [image1Loading, setImage1Loading] = useState(true);
  const [image2Loading, setImage2Loading] = useState(true);

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check Our Progress!</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.iconContainer}>
              <Icon name="play-circle" size={48} color={colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Our Progress Videos</Text>
            <Text style={styles.welcomeDescription}>
              Watch our latest progress videos to see how DENSE is evolving and improving. 
            </Text>
          </View>

          {/* Video 3-17 */}
          <View style={styles.videoSection}>
            <TouchableOpacity 
              style={styles.videoContainer}
              onPress={() => {
                setSelectedVideo('3-17');
                setShowVideoModal(true);
              }}
              activeOpacity={1}
            >
              {image1Loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
              <Image
                style={styles.videoThumbnail}
                source={require('@/assets/images/before-dense.jpeg')}
                resizeMode={ResizeMode.COVER}
                onLoad={() => setImage1Loading(false)}
                onError={() => setImage1Loading(false)}
              />
              {!image1Loading && (
                <View style={styles.videoPlayOverlay}>
                  <Icon name="play-circle" size={40} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Arrow Down Icon */}
          <View style={styles.arrowContainer}>
            <Icon name="arrow-down" size={60} color={colors.primary} />
          </View>

          {/* Video 3-16 */}
          <View style={styles.videoSection}>
            <TouchableOpacity 
              style={styles.videoContainer}
              onPress={() => {
                setSelectedVideo('3-16');
                setShowVideoModal(true);
              }}
              activeOpacity={1}
            >
              {image2Loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading thumbnail...</Text>
                </View>
              )}
              <Image
                style={styles.videoThumbnail}
                source={require('@/assets/images/after-dense.jpeg')}
                resizeMode={ResizeMode.COVER}
                onLoad={() => setImage2Loading(false)}
                onError={() => setImage2Loading(false)}
              />
              {!image2Loading && (
                <View style={styles.videoPlayOverlay}>
                  <Icon name="play-circle" size={40} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Video Modal */}
      <HomepageVideoModal
        visible={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoSource={selectedVideo === '3-16' 
          ? require('@/assets/videos/3-16.mp4')
          : require('@/assets/videos/3-17.mp4')
        }
      />
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  videoPlaceholder: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mediumGray,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    ...typography.h5,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDescription: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Video Section Styles
 
  videoSectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  videoContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16/9,
    position: 'relative',
    marginHorizontal: 20,
    height: 200,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  videoSection: {
    marginBottom: 24,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: 12,
    textAlign: 'center',
  },
});
