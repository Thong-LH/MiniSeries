import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';
import { SpaceBackground } from '../components/SpaceBackground';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/apiClient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { isAuthenticated } = useApp();
  const colors = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [historyLessons, setHistoryLessons] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2026, 6, 11)); // Default to July 2026
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 11)); // Selected day

  const fetchHistoryData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const historyRes = await apiClient.get('/lessons/my', { params: { page: 1, pageSize: 100 } });
      if (historyRes.data && Array.isArray(historyRes.data)) {
        setHistoryLessons(historyRes.data);
      }
    } catch (e) {
      console.log('Error fetching history data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistoryData();
    }
  }, [isAuthenticated]);

  // Helper: Month calendar generation
  const getDaysInMonth = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is CN
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for days before start of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Helper: Group lessons by week
  const getLessonsGroupedByWeek = (lessons: any[], currentMonth: Date) => {
    const currentMonthLessons = lessons.filter(lesson => {
      if (!lesson.createdAt) return false;
      const ld = new Date(lesson.createdAt);
      return ld.getMonth() === currentMonth.getMonth() && ld.getFullYear() === currentMonth.getFullYear();
    });

    const groups: { [key: string]: any[] } = {};
    currentMonthLessons.forEach(lesson => {
      const ld = new Date(lesson.createdAt);
      // Calculate week of month index
      const firstDay = new Date(ld.getFullYear(), ld.getMonth(), 1);
      const dayOffset = ld.getDate() + firstDay.getDay() - 1;
      const weekIndex = Math.floor(dayOffset / 7) + 1;
      const key = `Tuần ${weekIndex}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(lesson);
    });

    return Object.keys(groups).map(key => ({
      label: key,
      items: groups[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })).sort((a, b) => b.label.localeCompare(a.label));
  };

  // Calculate stats for the selected date
  const getSelectedDayStats = () => {
    const dayLessons = historyLessons.filter(lesson => {
      if (!lesson.createdAt) return false;
      const ld = new Date(lesson.createdAt);
      return ld.getDate() === selectedDate.getDate() &&
             ld.getMonth() === selectedDate.getMonth() &&
             ld.getFullYear() === selectedDate.getFullYear();
    });

    const totalStudyMinutes = dayLessons.length * 15; // 15 mins per lesson
    const totalTokens = dayLessons.length;
    const totalChapters = dayLessons.reduce((acc, l) => acc + (l.chapterCount || l.chapters?.length || 0), 0);

    return {
      lessonsCount: dayLessons.length,
      studyMinutes: totalStudyMinutes,
      tokensUsed: totalTokens,
      chaptersCount: totalChapters
    };
  };

  const selectedStats = getSelectedDayStats();
  const formattedSelectedDate = `Ngày ${selectedDate.getDate()} tháng ${selectedDate.getMonth() + 1}, ${selectedDate.getFullYear()}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SpaceBackground plain={true} />

      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>LỊCH SỬ SÁNG TẠO</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Calendar Month Card */}
        <View style={[styles.calendarHistoryCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {/* Month Chooser */}
          <View style={styles.monthChooserRow}>
            <TouchableOpacity
              onPress={() => {
                setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
              }}
              style={styles.monthNavBtn}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthLabelText, { color: colors.text }]}>
              THÁNG {selectedMonth.getMonth() + 1} {selectedMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
              }}
              style={styles.monthNavBtn}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid Weekday Labels */}
          <View style={styles.monthGridHeaderRow}>
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((label, idx) => (
              <Text key={idx} style={[styles.monthGridHeaderLabel, { color: colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Calendar Grid Days */}
          <View style={styles.monthGridDaysContainer}>
            {getDaysInMonth(selectedMonth).map((day, idx) => {
              if (!day) {
                return <View key={idx} style={styles.monthGridDayCellEmpty} />;
              }
              const dayNum = day.getDate();
              const isSelected = day.toDateString() === selectedDate.toDateString();
              const isToday = day.toDateString() === new Date(2026, 6, 11).toDateString(); // Today is July 11, 2026
              
              // Check if this day has creations
              const isActive = historyLessons.some(lesson => {
                if (!lesson.createdAt) return false;
                const ld = new Date(lesson.createdAt);
                return ld.getDate() === dayNum && 
                       ld.getMonth() === day.getMonth() && 
                       ld.getFullYear() === day.getFullYear();
              });

              return (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.monthGridDayCell}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(day)}
                >
                  <View style={[
                    styles.monthGridDateCircle,
                    isToday && { borderColor: colors.primaryAccent, borderWidth: 1.5 },
                    isSelected && { backgroundColor: colors.text, borderColor: colors.text },
                    isActive && !isSelected && { borderColor: '#6366f1', borderWidth: 1 }
                  ]}>
                    <Text style={[
                      styles.monthGridDateText,
                      { color: isSelected ? colors.bg : colors.text },
                      isActive && !isSelected && { color: '#6366f1', fontWeight: '900' }
                    ]}>
                      {dayNum}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={[
                      styles.monthGridActiveDot,
                      { backgroundColor: isSelected ? colors.bg : '#6366f1' }
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Stats Card */}
        <Text style={[styles.sectionSubtitle, { color: colors.text, marginTop: 4, marginBottom: 8 }]}>CHI TIẾT HOẠT ĐỘNG</Text>
        <View style={[styles.selectedDayCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.selectedDayTitle, { color: colors.text }]}>{formattedSelectedDate}</Text>
          <Text style={[styles.selectedDayDesc, { color: colors.textMuted }]}>
            {selectedStats.lessonsCount > 0 
              ? `Bạn đã thực hiện ${selectedStats.lessonsCount} hoạt động sáng tạo vào ngày này.`
              : 'Không có hoạt động sáng tạo nào được ghi nhận vào ngày này.'}
          </Text>

          <View style={styles.statsMetricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={20} color="#06b6d4" />
              <Text style={[styles.metricVal, { color: colors.text }]}>{selectedStats.studyMinutes} Phút</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Thời gian học</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricItem}>
              <Ionicons name="sparkles-outline" size={20} color="#6366f1" />
              <Text style={[styles.metricVal, { color: colors.text }]}>{selectedStats.tokensUsed} Tokens</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Đã tiêu thụ</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricItem}>
              <Ionicons name="book-outline" size={20} color="#eb5e28" />
              <Text style={[styles.metricVal, { color: colors.text }]}>{selectedStats.chaptersCount} Cảnh</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Số phân cảnh</Text>
            </View>
          </View>
        </View>

        {/* Weekly History List */}
        <Text style={[styles.sectionSubtitle, { color: colors.text, marginTop: 18, marginBottom: 8 }]}>LỊCH SỬ HÀNG TUẦN</Text>
        {loading && historyLessons.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginVertical: 20 }} />
        ) : (
          getLessonsGroupedByWeek(historyLessons, selectedMonth).map((weekGroup, groupIdx) => (
            <View key={groupIdx} style={styles.weekGroupContainer}>
              <View style={styles.weekGroupHeaderRow}>
                <Text style={[styles.weekGroupLabel, { color: colors.text }]}>{weekGroup.label}</Text>
                <Text style={[styles.weekGroupCount, { color: colors.textMuted }]}>
                  {weekGroup.items.length} Sáng tạo
                </Text>
              </View>
              {weekGroup.items.map((lesson, lessonIdx) => {
                const isVideo = lesson.outputMode === 1 || lesson.outputMode === 'Video';
                const dateObj = new Date(lesson.createdAt);
                const formattedTime = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true });
                const formattedDate = `${dateObj.getDate()} Th${dateObj.getMonth() + 1}`;
                return (
                  <View key={lesson.id} style={[styles.historyItemCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    {/* Left: Icon */}
                    <View style={[
                      styles.historyItemIconWrapper,
                      { backgroundColor: isVideo ? 'rgba(235, 94, 40, 0.12)' : 'rgba(99, 102, 241, 0.12)' }
                    ]}>
                      <Ionicons 
                        name={isVideo ? "film" : "book"} 
                        size={22} 
                        color={isVideo ? "#eb5e28" : "#6366f1"} 
                      />
                    </View>
                    {/* Center Info */}
                    <View style={styles.historyItemCenter}>
                      <Text style={[styles.historyItemTitle, { color: colors.text }]} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                      <Text style={[styles.historyItemCategory, { color: colors.textMuted }]}>
                        {isVideo ? "Sáng tạo Video" : "Sáng tạo Truyện tranh"}
                      </Text>
                      <View style={styles.historyItemMetaRow}>
                        <Text style={[styles.historyItemMetaText, { color: colors.textMuted }]}>
                          {formattedTime} • {formattedDate}
                        </Text>
                        <View style={[styles.historyItemDivider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.historyItemMetaText, { color: colors.textMuted }]}>
                          {lesson.chapterCount || lesson.chapters?.length || 0} phân cảnh
                        </Text>
                      </View>
                    </View>
                    {/* Right Option Dot */}
                    <TouchableOpacity style={styles.historyItemRight}>
                      <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))
        )}

        {getLessonsGroupedByWeek(historyLessons, selectedMonth).length === 0 && !loading && (
          <View style={[styles.emptyHistoryBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={40} color={colors.textMuted} style={{ opacity: 0.6 }} />
            <Text style={[styles.emptyHistoryText, { color: colors.textMuted, marginTop: 8 }]}>
              Không có hoạt động sáng tạo nào trong tháng {selectedMonth.getMonth() + 1}.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarHistoryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  monthChooserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthLabelText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  monthGridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthGridHeaderLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
  },
  monthGridDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  monthGridDayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  monthGridDayCellEmpty: {
    width: '14.28%',
    height: 44,
  },
  monthGridDateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGridDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthGridActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectedDayCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedDayTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  selectedDayDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 16,
  },
  statsMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
  },
  weekGroupContainer: {
    marginBottom: 16,
  },
  weekGroupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekGroupLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  weekGroupCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  historyItemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyItemCenter: {
    flex: 1,
    paddingRight: 8,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  historyItemCategory: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemMetaText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  historyItemDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
    opacity: 0.4,
  },
  historyItemRight: {
    padding: 6,
  },
  emptyHistoryBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyHistoryText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
