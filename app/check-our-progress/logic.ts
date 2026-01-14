import { useState } from 'react';
import { useRouter } from 'expo-router';

export const useCheckOurProgressLogic = () => {
  const router = useRouter();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [image1Loading, setImage1Loading] = useState(true);
  const [image2Loading, setImage2Loading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  const openVideo = (videoId: string) => {
    setSelectedVideo(videoId);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
  };

  const handleImage1Load = () => setImage1Loading(false);
  const handleImage1Error = () => setImage1Loading(false);

  const handleImage2Load = () => setImage2Loading(false);
  const handleImage2Error = () => setImage2Loading(false);

  const getVideoSource = () => {
    return selectedVideo === '3-16' 
      ? require('@/assets/videos/3-16.mp4')
      : require('@/assets/videos/3-17.mp4');
  };

  return {
    showVideoModal,
    image1Loading,
    image2Loading,
    handleBack,
    openVideo,
    closeVideoModal,
    handleImage1Load,
    handleImage1Error,
    handleImage2Load,
    handleImage2Error,
    getVideoSource,
  };
};