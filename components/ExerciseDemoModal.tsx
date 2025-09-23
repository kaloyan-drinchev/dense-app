import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { getExerciseVideoUrl } from '@/services/video-service';

interface ExerciseDemoModalProps {
  visible: boolean;
  onClose: () => void;
  exercise: {
    name: string;
    targetMuscle: string;
    imageUrl?: string;
    videoUrl?: string;
    notes?: string;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ExerciseDemoModal: React.FC<ExerciseDemoModalProps> = ({
  visible,
  onClose,
  exercise,
}) => {
  const [status, setStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const video = useRef(null);
  
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
      // Auto-play the video once it's loaded (with small delay)
      if (video.current && !isPlaying) {
        setTimeout(async () => {
          try {
            await video.current.playAsync();
            setIsPlaying(true);
          } catch (error) {
            console.log('Auto-play failed:', error);
          }
        }, 100);
      }
    }
    
    // Update playing state based on video status
    if (loadStatus.isLoaded) {
      setIsPlaying(loadStatus.isPlaying || false);
    }
  };

  // Reset loading and playing state when modal opens
  React.useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setIsPlaying(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={1}
          >
            <Icon name="x" size={20} color={colors.white} />
          </TouchableOpacity>

          <Video
            ref={video}
            style={styles.exerciseVideo}
            source={
              exercise.videoUrl 
                ? { uri: exercise.videoUrl }
                : { uri: getExerciseVideoUrl(exercise.name) }
            }
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={true}
            onPlaybackStatusUpdate={handleVideoLoad}
          />

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Exercise Demo...</Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.75,
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    elevation: 10,
  },
  exerciseVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    zIndex: 1000,
    elevation: 5,
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: 16,
    textAlign: 'center',
  },
});
