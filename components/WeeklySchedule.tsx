import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface WeeklyScheduleProps {
  trainingDays?: string[]; // e.g., ['monday', 'wednesday', 'friday']
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ 
  trainingDays = [] 
}) => {
  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const weekDates = getCurrentWeekDates();
  const today = new Date();

  const isTrainingDay = (dayIndex: number) => {
    const dayName = daysOfWeek[dayIndex];
    return trainingDays.some(trainingDay => 
      trainingDay.toLowerCase() === dayName.toLowerCase()
    );
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        {weekDates.map((date, index) => {
          const isTraining = isTrainingDay(index);
          const todayFlag = isToday(date);
          
          return (
            <View 
              key={index} 
              style={[
                styles.dayContainer,
                isTraining ? styles.trainingDay : styles.restDay,
                todayFlag && styles.todayBorder
              ]}
            >
              <Text style={[
                styles.dayAbbr,
                isTraining ? styles.trainingText : styles.restText
              ]}>
                {dayAbbreviations[index]}
              </Text>
              <Text style={[
                styles.dayNumber,
                isTraining ? styles.trainingText : styles.restText
              ]}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    minHeight: 48,
    minWidth: 40,
    justifyContent: 'center',
  },
  trainingDay: {
    backgroundColor: colors.primary,
  },
  restDay: {
    backgroundColor: colors.mediumGray,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  dayAbbr: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trainingText: {
    color: colors.black,
  },
  restText: {
    color: colors.lightGray,
  },
});
