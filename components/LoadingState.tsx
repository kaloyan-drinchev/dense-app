import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface LoadingStateProps {
  text?: string;
  showSkeleton?: boolean;
  skeletonType?: 'banner' | 'list' | 'card';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  text = "Loading...", 
  showSkeleton = false, 
  skeletonType = 'banner' 
}) => {
  const renderSkeleton = () => {
    switch (skeletonType) {
      case 'banner':
        return (
          <View style={styles.skeletonBanner}>
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonTextSmall} />
              <View style={styles.skeletonTextLarge} />
              <View style={styles.skeletonTextMedium} />
            </View>
            <View style={styles.skeletonButton} />
          </View>
        );
      
      case 'list':
        return (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.skeletonListItem}>
                <View style={styles.skeletonTextMedium} />
                <View style={styles.skeletonTextSmall} />
              </View>
            ))}
          </View>
        );
      
      case 'card':
        return (
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonTextLarge} />
            <View style={styles.skeletonTextMedium} />
            <View style={styles.skeletonTextSmall} />
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{text}</Text>
      </View>
      
      {showSkeleton && renderSkeleton()}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    marginTop: 20,
  },
  loadingContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.lightGray,
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Skeleton Banner
  skeletonBanner: {
    height: 120,
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.7,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTextSmall: {
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    width: '40%',
    opacity: 0.3,
  },
  skeletonTextMedium: {
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    width: '60%',
    opacity: 0.3,
  },
  skeletonTextLarge: {
    height: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    width: '80%',
    opacity: 0.3,
  },
  skeletonButton: {
    width: 100,
    height: 36,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    opacity: 0.3,
  },
  
  // Skeleton List
  skeletonList: {
    gap: 12,
  },
  skeletonListItem: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    opacity: 0.7,
  },
  
  // Skeleton Card
  skeletonCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    opacity: 0.7,
  },
});
