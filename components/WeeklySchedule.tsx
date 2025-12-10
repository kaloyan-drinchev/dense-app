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

  const isPastDay = (date: Date) => {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < todayStart;
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        {weekDates.map((date, index) => {
          const isTraining = isTrainingDay(index);
          const todayFlag = isToday(date);
          const pastDay = isPastDay(date);
          
          return (
            <View 
              key={index} 
              style={[
                styles.dayContainer,
                isTraining ? (pastDay ? styles.pastTrainingDay : styles.trainingDay) : styles.restDay,
                todayFlag && styles.todayBorder
              ]}
            >
              <Text 
                style={[
                  styles.dayAbbr,
                  isTraining ? styles.trainingText : styles.restText
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {dayAbbreviations[index]}
              </Text>
              <Text 
                style={[
                  styles.dayNumber,
                  isTraining ? styles.trainingText : styles.restText
                ]}
                numberOfLines={1}
              >
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, styles.trainingDay]} />
          <Text style={styles.legendText}>Workout Day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, styles.restDay]} />
          <Text style={styles.legendText}>Rest Day</Text>
        </View>
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
    gap: 4,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    minHeight: 48,
    minWidth: 38,
    justifyContent: 'center',
  },
  trainingDay: {
    backgroundColor: colors.primary,
  },
  pastTrainingDay: {
    backgroundColor: '#00AA55', // Darker, muted green for past training days
  },
  restDay: {
    backgroundColor: colors.mediumGray,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  dayAbbr: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: colors.lightGray,
  },
});
