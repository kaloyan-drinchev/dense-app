import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { StatItem } from './StatItem';

interface StatData {
  value: string | number;
  label: string;
  infoTitle: string;
  infoDescription: string;
}

interface StatGroupProps {
  stats: StatData[];
  style?: any;
}

export const StatGroup: React.FC<StatGroupProps> = ({ stats, style }) => {
  const [showStatsInfo, setShowStatsInfo] = useState(false);
  const [selectedStatInfo, setSelectedStatInfo] = useState<{title: string, description: string} | null>(null);

  const showStatInfo = (title: string, description: string) => {
    setSelectedStatInfo({ title, description });
    setShowStatsInfo(true);
  };

  const hideStatInfo = () => {
    setShowStatsInfo(false);
    setSelectedStatInfo(null);
  };

  return (
    <>
      <View style={[styles.progressStats, style]}>
        {stats.map((stat, index) => (
          <StatItem
            key={index}
            value={stat.value}
            label={stat.label}
            onPress={() => showStatInfo(stat.infoTitle, stat.infoDescription)}
          />
        ))}
      </View>

      {/* Stats Info Modal */}
      {selectedStatInfo && (
        <Modal
          visible={showStatsInfo}
          transparent={true}
          animationType="fade"
          onRequestClose={hideStatInfo}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={hideStatInfo}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[colors.darkGray, colors.mediumGray]}
                style={styles.infoModalContent}
              >
                <Text style={styles.infoModalTitle}>{selectedStatInfo.title}</Text>
                <Text style={styles.infoModalDescription}>{selectedStatInfo.description}</Text>
                <TouchableOpacity
                  style={styles.infoModalButton}
                  onPress={hideStatInfo}
                >
                  <Text style={styles.infoModalButtonText}>Got it!</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    paddingVertical: 20,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  infoModalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  infoModalTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoModalDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoModalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  infoModalButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
  },
});
