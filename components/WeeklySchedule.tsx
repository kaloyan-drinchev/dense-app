import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface WeeklyScheduleProps {
  trainingDays?: string[]; // e.g., ['monday', 'wednesday', 'friday']
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const WEEKS_TO_SHOW = 26; // 3 months back + 3 months forward (approximately 26 weeks)

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ 
  trainingDays = [] 
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(Math.floor(WEEKS_TO_SHOW / 2));
  const [today, setToday] = useState(new Date());

  // Get week dates starting from a specific Monday
  const getWeekDates = (mondayDate: Date) => {
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  // Generate all weeks (3 months past to 3 months future)
  const generateAllWeeks = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weeks = [];
    const startWeekOffset = -Math.floor(WEEKS_TO_SHOW / 2); // Go back half the weeks
    
    for (let i = 0; i < WEEKS_TO_SHOW; i++) {
      const monday = new Date(currentMonday);
      monday.setDate(currentMonday.getDate() + (startWeekOffset + i) * 7);
      weeks.push({
        id: i.toString(),
        monday: monday,
        dates: getWeekDates(monday),
      });
    }
    
    return weeks;
  };

  const allWeeks = generateAllWeeks();

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Update "today" at midnight to keep calendar accurate
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const currentDateString = now.toDateString();
      
      // If date has changed, update today
      if (currentDateString !== today.toDateString()) {
        setToday(now);
      }
    };
    
    // Calculate milliseconds until next midnight
    const getMillisecondsUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      return tomorrow.getTime() - now.getTime();
    };
    
    // Check for date change at midnight
    const msUntilMidnight = getMillisecondsUntilMidnight();
    const midnightTimer = setTimeout(() => {
      checkDateChange();
      
      // Set up daily check after first midnight
      const dailyInterval = setInterval(checkDateChange, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);
    
    return () => clearTimeout(midnightTimer);
  }, [today]);

  // Scroll to current week on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: currentWeekIndex,
        animated: false,
        viewPosition: 0.5, // Center the current week
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  const renderWeek = ({ item }: { item: { id: string; monday: Date; dates: Date[] } }) => {
    const firstDate = item.dates[0];
    const lastDate = item.dates[6];
    const monthYear = firstDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    return (
      <View style={styles.weekContainer}>
        {/* Month/Year Label */}
        <Text style={styles.monthLabel}>{monthYear}</Text>
        
        {/* Week Row */}
        <View style={styles.weekRow}>
          {item.dates.map((date, index) => {
            const isTraining = isTrainingDay(index);
            const todayFlag = isToday(date);
            const pastDay = isPastDay(date);
            
            return (
              <View 
                key={index} 
                style={[
                  styles.dayContainer,
                  pastDay ? styles.pastDay : styles.neutralDay,
                  todayFlag && styles.todayBorder
                ]}
              >
                <Text 
                  style={[
                    styles.dayAbbr,
                    styles.neutralText
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
                    styles.neutralText
                  ]}
                  numberOfLines={1}
                >
                  {date.getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={allWeeks}
        renderItem={renderWeek}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH - 40} // Adjust based on padding
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH - 40,
          offset: (SCREEN_WIDTH - 40) * index,
          index,
        })}
        initialScrollIndex={currentWeekIndex}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    marginBottom: 16,
  },
  flatListContent: {
    paddingHorizontal: 0,
  },
  weekContainer: {
    width: SCREEN_WIDTH - 40, // Account for screen padding
    paddingHorizontal: 10,
  },
  monthLabel: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
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
  neutralDay: {
    backgroundColor: colors.mediumGray,
  },
  pastDay: {
    backgroundColor: colors.darkGray,
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
  neutralText: {
    color: colors.lightGray,
  },
});
