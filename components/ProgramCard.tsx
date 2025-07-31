import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Program } from '@/types/workout';
import { colors, programColors } from '@/constants/colors';
import Icon from 'react-native-vector-icons/Feather';

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
}

const { width } = Dimensions.get('window');

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onPress,
}) => {
  const colorScheme =
    program.type === 'bulking' ? programColors.bulking : programColors.cutting;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: program.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{program.name}</Text>
          <View style={[styles.badge, { backgroundColor: colorScheme.accent }]}>
            <Text style={styles.badgeText}>{program.type.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.description}>{program.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.duration}>{program.duration} Weeks</Text>
          <View style={styles.button}>
            <Text style={styles.buttonText}>View Program</Text>
            <Icon name="arrow-right" size={16} color={colors.white} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: colors.darkGray,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  description: {
    fontSize: 14,
    color: colors.lighterGray,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
});
