// Helper function to get icon for each cardio type
export const getCardioIcon = (cardioId: string): string => {
    const iconMap: { [key: string]: string } = {
      'treadmill': 'activity',
      'bicycle': 'disc',
      'stair-master': 'trending-up',
      'rowing-machine': 'minus',
      'elliptical': 'refresh-cw',
      'jumping-rope': 'zap',
      'running-outdoor': 'wind',
      'walking': 'user',
      'swimming': 'droplet',
      'other': 'grid',
    };
    return iconMap[cardioId] || 'circle';
  };