import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface WorkoutCalendarHeatMapProps {
  completedDates: string[]; // Array of completed workout dates in 'YYYY-MM-DD' format
  startDate?: string; // Program start date
  currentWeek: number;
}

export const WorkoutCalendarHeatMap: React.FC<WorkoutCalendarHeatMapProps> = ({
  completedDates = [],
  startDate,
  currentWeek,
}) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  console.log(`📅 Today's actual date: ${today.toDateString()}`);
  console.log(`📅 Selected date: ${selectedDate.toDateString()}`);
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Navigation functions
  const goToPreviousMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Generate calendar data for current month
  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = lastDayOfMonth.getDate();



    const days = [];
    
    // Add previous month's trailing days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = completedDates.includes(dateStr);
      
      days.push({
        day,
        dateStr,
        isCompleted,
        isToday: false,
        isPast: true,
        isFuture: false,
        dayStatus: 'disabled' as const,
        isCurrentMonth: false,
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = completedDates.includes(dateStr);
      
      // Check if this day is today (considering the selected month/year)
      const isToday = currentYear === today.getFullYear() && 
                     currentMonth === today.getMonth() && 
                     day === today.getDate();
      
      // Check if day is past/future relative to actual today
      const dayDate = new Date(currentYear, currentMonth, day);
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isPast = dayDate < todayDate;
      const isFuture = dayDate > todayDate;
      
      // Determine the status for this day
      let dayStatus: 'completed' | 'missed' | 'today' | 'future' | 'disabled' = 'future';
      
      if (isFuture) {
        dayStatus = 'future';
      } else if (isToday) {
        dayStatus = isCompleted ? 'completed' : 'today';
      } else if (isPast) {
        dayStatus = isCompleted ? 'completed' : 'missed';
      }

      days.push({
        day,
        dateStr,
        isCompleted,
        isToday,
        isPast,
        isFuture,
        dayStatus,
        isCurrentMonth: true,
      });
    }

    // Add next month's leading days to complete the 6x7 grid
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let day = 1; day <= remainingCells; day++) {
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = completedDates.includes(dateStr);
      
      days.push({
        day,
        dateStr,
        isCompleted,
        isToday: false,
        isPast: false,
        isFuture: true,
        dayStatus: 'disabled' as const,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, completedDates, today]);

  // Calculate stats
  const stats = useMemo(() => {
    const completedThisMonth = calendarData.filter(day => 
      day && day.isCompleted
    ).length;
    
    const workoutDaysThisMonth = calendarData.filter(day => 
      day && (day.isPast || day.isToday)
    ).length;

    const currentStreak = getCurrentStreak(completedDates);
    
    return {
      completedThisMonth,
      workoutDaysThisMonth,
      currentStreak,
      completionRate: workoutDaysThisMonth > 0 ? Math.round((completedThisMonth / workoutDaysThisMonth) * 100) : 0,
    };
  }, [calendarData, completedDates]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Workout Consistency</Text>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedThisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>

      {/* Calendar Header with Navigation */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Icon name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToCurrentMonth} style={styles.monthTitleContainer}>
          <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
          {currentYear !== today.getFullYear() || currentMonth !== today.getMonth() ? (
            <Text style={styles.currentMonthHint}>Tap to return to current month</Text>
          ) : null}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Icon name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day Labels */}
      <View style={styles.dayLabelsRow}>
        {dayLabels.map((label, index) => (
          <Text key={index} style={styles.dayLabel}>{label}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {Array.from({ length: Math.ceil(calendarData.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {calendarData.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
              <View key={dayIndex} style={styles.dayContainer}>
                <View style={[
                  styles.daySquare,
                  day.dayStatus === 'completed' && styles.completedDay,
                  day.dayStatus === 'today' && styles.todayDay,
                  day.dayStatus === 'missed' && styles.missedDay,
                  day.dayStatus === 'future' && styles.futureDay,
                  day.dayStatus === 'disabled' && styles.disabledDay,
                ]}>
                  <Text style={[
                    styles.dayText,
                    day.dayStatus === 'completed' && styles.completedDayText,
                    day.dayStatus === 'today' && styles.todayDayText,
                    day.dayStatus === 'disabled' && styles.disabledDayText,
                  ]}>
                    {day.day}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, styles.completedDay]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, styles.missedDay]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, styles.todayDay]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

// Helper function to calculate current streak
function getCurrentStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const sortedDates = completedDates
    .map(date => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  for (const completedDate of sortedDates) {
    const completed = new Date(completedDate);
    completed.setHours(0, 0, 0, 0);

    if (completed.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (completed.getTime() < currentDate.getTime()) {
      break;
    }
  }

  return streak;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    fontFamily: 'Saira-Bold',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
    marginTop: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.darkGray,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...typography.h4,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  currentMonthHint: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 2,
    justifyContent: 'flex-start',
  },
  dayLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  calendar: {
    marginBottom: 16,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 2,
    justifyContent: 'flex-start',
  },
  dayContainer: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  daySquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    maxWidth: '100%',
    aspectRatio: 1,
  },
  emptyDay: {
    width: 32,
    height: 32,
  },
  completedDay: {
    backgroundColor: colors.primary, // Green for completed workouts
  },
  missedDay: {
    backgroundColor: colors.mediumGray,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  todayDay: {
    backgroundColor: colors.gradientMiddle, // Cyan for today's workout (not completed yet)
    borderWidth: 2,
    borderColor: colors.darkGray,
  },
  futureDay: {
    backgroundColor: colors.darkGray,
    opacity: 0.5,
  },
  disabledDay: {
    backgroundColor: 'transparent',
  },
  dayText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  completedDayText: {
    color: '#000000', // Explicit black for completed workouts
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#000000', // Explicit black for today's workout
    fontWeight: 'bold',
  },
  disabledDayText: {
    color: colors.lightGray,
    opacity: 0.4,
    fontSize: 11,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
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
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
  },
});
