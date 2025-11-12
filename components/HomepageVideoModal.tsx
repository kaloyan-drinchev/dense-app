import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';

interface HomepageVideoModalProps {
  visible: boolean;
  onClose: () => void;
  videoSource?: any; // Local video source
  videoUrl?: string; // Deprecated: for backward compatibility
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const HomepageVideoModal: React.FC<HomepageVideoModalProps> = ({
  visible,
  onClose,
  videoSource: propVideoSource,
  videoUrl: propVideoUrl,
}) => {
  const [status, setStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const video = useRef(null);
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      return true;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to downward swipes
      return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (evt, gestureState) => {
      // Do nothing during move - just detect the gesture
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy, vy } = gestureState;
      
      // If swiped down more than 50px or with high velocity, close modal
      if (dy > 50 || vy > 0.5) {
        onClose();
      }
    },
  });

  const handlePlayPause = async () => {
    if (video.current) {
      if (isPlaying) {
        await video.current.pauseAsync();
      } else {
        await video.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoLoad = async (loadStatus) => {
    setStatus(loadStatus);
    
    if (loadStatus.isLoaded) {
      setIsLoading(false);
    }
    
    if (loadStatus.error) {
      setIsLoading(false);
    }
    
    // Update playing state based on video status
    if (loadStatus.isLoaded) {
      setIsPlaying(loadStatus.isPlaying || false);
    }
  };

  // Video source - prioritize local source, fallback to URL (for backward compatibility)
  const videoSource = propVideoSource || (propVideoUrl ? { uri: propVideoUrl } : require('@/assets/videos/3-17.mp4'));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View 
          style={styles.modalContainer}
          {...panResponder.panHandlers}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={1}
          >
            <Icon name="x" size={20} color={colors.white} />
          </TouchableOpacity>

          <Video
            ref={video}
            style={styles.homepageVideo}
            source={videoSource}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={true}
            isMuted={false}
            onPlaybackStatusUpdate={handleVideoLoad}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homepageVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
    borderRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: 12,
  },
});
