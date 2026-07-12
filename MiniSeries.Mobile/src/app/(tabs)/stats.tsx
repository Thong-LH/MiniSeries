import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, Animated, Easing, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/use-theme';
import { SpaceBackground } from '../../components/SpaceBackground';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { useNavigation, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlyingPageBadge, Achievement } from '../../components/FlyingPageBadge';
import { LevelAvatar } from '../../components/LevelAvatar';

const { width } = Dimensions.get('window');

interface DashboardStats {
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: Array<{ dayLabel: string; dateStr: string; isActive: boolean; activityCount?: number }>;
  totalStudyMinutes: number;
  completedLessons: number;
  mangaCount: number;
  videoCount: number;
  totalLessons: number;
  totalExp?: number;
  currentLevel?: number;
  levelLabel?: string;
  nextLevelExp?: number;
  prevLevelExp?: number;
}

export default function StatsScreen() {
  const {
    themeId,
    setThemeId,
    mangaTokens,
    videoTokens,
    weeklyTarget,
    setWeeklyTarget,
    updateStatsFromData,
    globalStreak,
    isAuthenticated,
    shouldRefreshHome,
    activePlan,
  } = useApp();
  const colors = useTheme();
  const isDark = colors.isDark;
  const navigation = useNavigation();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats>({
    currentStreak: 0,
    longestStreak: 1,
    weeklyActivity: [],
    totalStudyMinutes: 0,
    completedLessons: 0,
    mangaCount: 0,
    videoCount: 0,
    totalLessons: 0,
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState<boolean>(false);
  const [historyLessons, setHistoryLessons] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showTargetSelector, setShowTargetSelector] = useState<boolean>(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState<boolean>(false);
  const [localStudyMinutes, setLocalStudyMinutes] = useState<number>(0);

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedStats = await AsyncStorage.getItem('cached_dashboard_stats');
        if (cachedStats) {
          setStats(JSON.parse(cachedStats));
        }
        const cachedHistory = await AsyncStorage.getItem('cached_history_lessons');
        if (cachedHistory) {
          setHistoryLessons(JSON.parse(cachedHistory));
        }
        const cachedTimer = await AsyncStorage.getItem('local_study_timer_data');
        if (cachedTimer) {
          const parsed = JSON.parse(cachedTimer);
          const totalSeconds = Object.values(parsed).reduce((acc: number, val: any) => acc + (val || 0), 0);
          setLocalStudyMinutes(Math.round(totalSeconds / 60));
        }
      } catch (e) {
        console.log('Error loading cache:', e);
      }
    };
    loadCachedData();
  }, []);

  const getWeeklyCalendar = () => {
    const days = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dayLabel = dayLabels[i];
      const isToday = d.toDateString() === today.toDateString();
      const isActive = historyLessons.some(lesson => {
        if (!lesson.createdAt) return false;
        const ld = new Date(lesson.createdAt);
        return ld.getDate() === d.getDate() &&
          ld.getMonth() === d.getMonth() &&
          ld.getFullYear() === d.getFullYear();
      });
      days.push({
        dayLabel,
        dateNum: d.getDate(),
        isToday,
        isActive,
        dateObj: d
      });
    }
    return days;
  };

  const selectorAnim = useRef(new Animated.Value(0)).current;
  const lastFetchTimeRef = useRef<number>(0);

  const openBadgeDetail = (badge?: Achievement) => {
    router.push({
      pathname: '/achievements' as any,
      params: badge ? { selectedKey: badge.key } : {}
    });
  };

  useEffect(() => {
    Animated.timing(selectorAnim, {
      toValue: showTargetSelector ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [showTargetSelector]);

  const selectorHeight = selectorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 52],
  });

  const selectorOpacity = selectorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.2, 1],
  });

  const toggleTheme = () => {
    setThemeId(themeId === 'bold-typography-dark' ? 'bold-typography' : 'bold-typography-dark');
  };

  const fetchDashboardStats = async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent && stats.weeklyActivity.length === 0) {
      setLoading(true);
    }
    try {
      const res = await apiClient.get('/progress/dashboard');
      if (res.data) {
        setStats(res.data);
        updateStatsFromData(res.data);
      }
    } catch (e) {
      console.log('Lỗi tải dữ liệu thống kê từ API:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    if (!isAuthenticated) return;
    if (!achievements || achievements.length === 0) setLoadingAchievements(true);
    try {
      const res = await apiClient.get('/progress/achievements');
      if (res.data) {
        setAchievements(res.data);
      }
    } catch (e) {
      console.log('Lỗi tải danh hiệu từ API:', e);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const fetchStatsData = async (force = false) => {
    if (!isAuthenticated) return;
    const hasData = stats.weeklyActivity.length > 0 || historyLessons.length > 0;
    try {
      if (!hasData || force) {
        setLoading(true);
        setLoadingHistory(true);
      }
      const [statsRes, achievementsRes, historyRes] = await Promise.all([
        apiClient.get('/progress/dashboard'),
        apiClient.get('/progress/achievements'),
        apiClient.get('/lessons/my', { params: { page: 1, pageSize: 100 } })
      ]);
      if (statsRes.data) {
        setStats(statsRes.data);
        updateStatsFromData(statsRes.data);
        AsyncStorage.setItem('cached_dashboard_stats', JSON.stringify(statsRes.data)).catch(err => console.log(err));
      }
      if (achievementsRes.data) {
        setAchievements(achievementsRes.data);
      }
      if (historyRes.data && Array.isArray(historyRes.data)) {
        setHistoryLessons(historyRes.data);
        AsyncStorage.setItem('cached_history_lessons', JSON.stringify(historyRes.data)).catch(err => console.log(err));
      }
    } catch (e) {
      console.log('Error fetching stats data:', e);
    } finally {
      setLoading(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        fetchStatsData(true);
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatsData(true);
    }
  }, [isAuthenticated]);



  // Lấy các ngày trong tháng (bao gồm cả các ô trống padding ở đầu tháng)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = CN, 1 = T2...
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  // Phân nhóm lịch sử bài học đã tạo theo tuần trong tháng được chọn
  const getLessonsGroupedByWeek = (lessonsList: any[], targetMonth: Date) => {
    const month = targetMonth.getMonth();
    const year = targetMonth.getFullYear();

    // Lọc các bài học trong tháng này
    const monthLessons = lessonsList.filter(lesson => {
      if (!lesson.createdAt) return false;
      const d = new Date(lesson.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    // Sắp xếp bài học mới nhất lên đầu
    monthLessons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Nhóm theo tuần
    const weeks: Record<string, { label: string; items: any[] }> = {};

    monthLessons.forEach(lesson => {
      const d = new Date(lesson.createdAt);
      const currentDay = d.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

      const monday = new Date(d);
      monday.setDate(d.getDate() - distanceToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const key = `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`;

      const formattedMonday = `${monday.getDate()} Th${monday.getMonth() + 1}`;
      const formattedSunday = `${sunday.getDate()} Th${sunday.getMonth() + 1}`;
      const label = `${formattedMonday} - ${formattedSunday}, ${monday.getFullYear()}`;

      if (!weeks[key]) {
        weeks[key] = { label, items: [] };
      }
      weeks[key].items.push(lesson);
    });

    return Object.values(weeks);
  };

  // Focus rating/score calculations
  const totalCreated = stats.mangaCount + stats.videoCount;
  // Score = average lessons per week scaled, let's say: 
  const focusScore = Math.min(40, Math.max(12, 15 + stats.completedLessons * 3 + stats.currentStreak * 1.5));

  let scoreCategory = 'Trung bình';
  if (focusScore >= 35) scoreCategory = 'Xuất sắc';
  else if (focusScore >= 25) scoreCategory = 'Hiệu suất cao';
  else if (focusScore >= 18.5) scoreCategory = 'Tiêu chuẩn';

  // Pointer position on the BMI style bar (0% to 100%)
  // Range is 15 to 40
  const pointerPercentage = Math.min(100, Math.max(0, ((focusScore - 15) / (40 - 15)) * 100));

  // Tính toán lại cấp độ nếu API cũ bị giới hạn (Fallback vô hạn)
  let displayLevel = stats.currentLevel ?? 1;
  let displayPrevExp = stats.prevLevelExp ?? 0;
  let displayNextExp = stats.nextLevelExp ?? 100;
  let displayLevelLabel = stats.levelLabel ?? 'Tập sự';

  const totalExp = stats.totalExp ?? 0;

  if (totalExp >= displayNextExp) {
    let levelReq = displayNextExp - displayPrevExp;
    // Nếu levelReq <= 0 do data lỗi, reset về logic chuẩn từ đầu
    if (levelReq <= 0) {
      displayLevel = 1;
      displayPrevExp = 0;
      levelReq = 100;
    }

    while (totalExp >= displayPrevExp + levelReq) {
      displayPrevExp += levelReq;
      displayLevel++;
      levelReq = 100 * (1 << (displayLevel - 1));
    }
    displayNextExp = displayPrevExp + levelReq;

    if (displayLevel >= 6) {
      displayLevelLabel = `Khai sáng Lvl ${displayLevel}`;
    }
  }

  // EXP thăng cấp percentage
  const currentLevelExp = totalExp;
  const expProgress = currentLevelExp - displayPrevExp;
  const expRange = Math.max(1, displayNextExp - displayPrevExp);
  const expPercentage = Math.min(100, Math.max(0, (expProgress * 100) / expRange));

  // Sắp xếp huy hiệu: đã đạt được lên đầu, chưa đạt được xếp sau theo bộ
  const getSortedAchievements = () => {
    return [...achievements].sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      return a.category.localeCompare(b.category);
    });
  };

  const renderStreakFlame = (streakCount: number, size: number = 14) => {
    if (streakCount === 0) {
      return <Text style={{ fontSize: size, opacity: 0.35 }}>❄️</Text>;
    }
    if (streakCount < 3) {
      return <Text style={{ fontSize: size }}>🔥</Text>;
    }
    if (streakCount < 7) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size }}>🔥</Text>
          <Text style={{ fontSize: size - 2, color: '#eab308', marginLeft: -2 }}>⚡</Text>
        </View>
      );
    }
    if (streakCount < 30) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size }}>🔥</Text>
          <Text style={{ fontSize: size - 4, color: '#38bdf8', marginHorizontal: -2 }}>✨</Text>
          <Text style={{ fontSize: size }}>🔥</Text>
        </View>
      );
    }
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size - 6, marginBottom: -3 }}>👑</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size - 4, color: '#a855f7' }}>✨</Text>
          <Text style={{ fontSize: size + 2 }}>🔥</Text>
          <Text style={{ fontSize: size - 4, color: '#a855f7' }}>✨</Text>
        </View>
      </View>
    );
  };

  const displayLessons = historyLessons.length || stats.totalLessons || stats.completedLessons || 0;
  const displayStudyMinutes = (stats.totalStudyMinutes || 0) + localStudyMinutes;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SpaceBackground plain={true} />

      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
        <Text style={[styles.brand, { color: colors.text }]}>MINISERIES</Text>

        <View style={styles.headerRightBadges}>
          <View style={[styles.streakBadge, { borderColor: colors.border, backgroundColor: colors.bg, paddingLeft: 6, paddingRight: 8 }]}>
            {renderStreakFlame(globalStreak, 13)}
            <Text style={[styles.streakText, { color: colors.text, marginLeft: 3 }]}>{globalStreak}</Text>
          </View>
          {/* Gamified Level Avatar with Circular Progress */}
          <LevelAvatar />
        </View>
      </View>

      {loading && stats.totalLessons === 0 ? (
        <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginTop: 80 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>BÁO CÁO</Text>
          <View style={[styles.levelCard, { backgroundColor: colors.cardBg, borderColor: colors.border, marginBottom: 12 }]}>
            <View style={styles.levelHeaderRow}>
              <View>
                <Text style={[styles.levelSubTitle, { color: colors.textMuted }]}>CẤP ĐỘ HIỆN TẠI</Text>
                <Text style={[styles.levelTitleText, { color: colors.primaryAccent }]}>
                  Lv.{displayLevel} • {displayLevelLabel}
                </Text>
              </View>
              <View style={styles.expTextContainer}>
                <Text style={[styles.expText, { color: colors.text }]}>
                  {totalExp} <Text style={{ color: colors.textMuted, fontSize: 10 }}>/ {displayNextExp} EXP</Text>
                </Text>
              </View>
            </View>
            <View style={[styles.levelProgressBarBg, { backgroundColor: colors.border }]}>
              <View style={[
                styles.levelProgressBarFill,
                {
                  backgroundColor: colors.primaryAccent,
                  width: `${expPercentage}%`
                }
              ]} />
            </View>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' }}>
              Cần thêm {Math.max(0, displayNextExp - totalExp)} EXP để thăng cấp tiếp theo.
            </Text>
          </View>

          {/* Top 3-column Stats Header Card - BELOW LEVEL */}
          <View style={[styles.mainStatsHeaderCard, { backgroundColor: colors.cardBg, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 18, borderRadius: 16, borderWidth: 1, marginBottom: 20 }]}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name="book-outline" size={18} color="#0284c7" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#0284c7' }}>{displayLessons}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, marginTop: 4 }}>Bài học</Text>
            </View>
            <View style={{ width: 1, height: 38, backgroundColor: colors.border }} />
            <View style={{ flex: 1.4, alignItems: 'center' }}>
              <Ionicons name="sparkles-outline" size={18} color="#6366f1" style={{ marginBottom: 6 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#6366f1' }}>{stats.mangaCount}</Text>
                <Text style={{ fontSize: 20, fontWeight: '300', color: colors.border, marginHorizontal: 4 }}>/</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#eb5e28' }}>{stats.videoCount}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, marginTop: 4 }}>Manga / Video</Text>
            </View>
            <View style={{ width: 1, height: 38, backgroundColor: colors.border }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name="time-outline" size={18} color="#f59e0b" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#f59e0b' }}>{displayStudyMinutes}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, marginTop: 4 }}>Phút</Text>
            </View>
          </View>

          {/* Section 2: Tuần này */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Tuần này</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/history')}
              style={styles.historyLinkBtn}
            >
              <Text style={[styles.historyLinkText, { color: colors.primaryAccent }]}>Lịch sử &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.historyCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 }]}>
            <View style={[styles.calendarRow, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }]}>
              {getWeeklyCalendar().map((day, index) => (
                <View key={index} style={[styles.calendarCol, { alignItems: 'center', flex: 1 }]}>
                  <Text style={[styles.calendarDayLabel, { color: colors.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 6 }]}>{day.dayLabel}</Text>
                  <View style={[
                    styles.calendarDateCircle,
                    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
                    day.isToday && { borderColor: colors.primaryAccent, borderWidth: 1.5 },
                    day.isActive && { backgroundColor: 'rgba(99, 102, 241, 0.15)' }
                  ]}>
                    <Text style={[
                      styles.calendarDateText,
                      { color: day.isToday ? colors.primaryAccent : colors.text, fontSize: 13, fontWeight: '700' },
                      day.isActive && { color: '#6366f1', fontWeight: '900' }
                    ]}>
                      {day.dateNum}
                    </Text>
                    {day.isActive && <View style={[styles.activeDayDot, { width: 4, height: 4, borderRadius: 2, backgroundColor: '#6366f1', marginTop: 1 }]} />}
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.calendarDivider, { height: 1, backgroundColor: colors.border, marginVertical: 12 }]} />

            <View style={[styles.streakFooterRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {renderStreakFlame(stats.currentStreak, 18)}
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginLeft: 6 }}>{stats.currentStreak} ngày liên tiếp</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>Kỷ lục cá nhân: {stats.longestStreak} ngày</Text>
            </View>
          </View>

          {/* Section 3: Tần suất hoạt động (Activity Bar Chart) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Tần suất hoạt động</Text>
          </View>

          <View style={[styles.weightProgressCard, { backgroundColor: colors.cardBg, borderColor: colors.border, marginBottom: 20 }]}>
            <View style={styles.weightHeaderRow}>
              <View>
                <Text style={[styles.weightHeaderLabel, { color: colors.textMuted }]}>Tổng bài học</Text>
                <Text style={[styles.weightHeaderVal, { color: colors.text, fontSize: 16, fontWeight: '900' }]}>{stats.completedLessons} bài</Text>
              </View>
              <View style={styles.weightHeaderRight}>
                <Text style={[styles.weightMinMaxLabel, { color: colors.textMuted }]}>Chuỗi học: {stats.currentStreak} ngày</Text>
                <Text style={[styles.weightMinMaxLabel, { color: colors.textMuted }]}>Thời gian: {stats.totalStudyMinutes} phút</Text>
              </View>
            </View>

            <View style={styles.lineChartContainer}>
              <View style={[styles.gridLine, { top: '0%' }]} />
              <View style={[styles.gridLine, { top: '25%' }]} />
              <View style={[styles.gridLine, { top: '50%' }]} />
              <View style={[styles.gridLine, { top: '75%' }]} />
              <View style={[styles.gridLine, { top: '100%' }]} />

              {loading && stats.weeklyActivity.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <ActivityIndicator size="small" color={colors.primaryAccent} />
                </View>
              ) : (
                <View style={styles.chartPointsRow}>
                  {getWeeklyCalendar().map((day, idx) => {
                    // Count lessons from historyLessons for this day (more accurate than API weeklyActivity)
                    const count = historyLessons.filter(lesson => {
                      if (!lesson.createdAt) return false;
                      const ld = new Date(lesson.createdAt);
                      return ld.getDate() === day.dateObj.getDate() &&
                        ld.getMonth() === day.dateObj.getMonth() &&
                        ld.getFullYear() === day.dateObj.getFullYear();
                    }).length;
                    const heightVal = count === 0 ? 10 : Math.min(90, 15 + count * 25);
                    const isToday = day.isToday;
                    return (
                      <View key={idx} style={styles.chartColContainer}>
                        <View style={[
                          styles.barFillVisual,
                          {
                            height: `${heightVal}%`,
                            backgroundColor: isToday
                              ? 'rgba(99, 102, 241, 0.45)'
                              : count > 0
                                ? 'rgba(99, 102, 241, 0.25)'
                                : 'rgba(148, 163, 184, 0.12)',
                            borderColor: isToday ? '#6366f1' : count > 0 ? 'rgba(99, 102, 241, 0.4)' : 'rgba(148, 163, 184, 0.2)',
                            borderWidth: 1,
                            borderRadius: 6,
                          }
                        ]}>
                          {count > 0 && (
                            <Text style={{
                              fontSize: 8,
                              fontWeight: '900',
                              color: isToday ? '#6366f1' : colors.textMuted,
                              position: 'absolute',
                              top: -14,
                              alignSelf: 'center'
                            }}>
                              +{count}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.chartDatesRow}>
              {getWeeklyCalendar().map((day, idx) => (
                <Text key={idx} style={[styles.chartDateLabel, { color: day.isToday ? colors.primaryAccent : colors.textMuted, fontWeight: day.isToday ? '900' : '600' }]}>
                  {day.dayLabel}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Bộ sưu tập huy hiệu</Text>
            <TouchableOpacity onPress={() => openBadgeDetail()}>
              <Text style={{ color: colors.primaryAccent, fontSize: 14, fontWeight: '800' }}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.badgesContainerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ fontSize: 13.5, color: colors.textMuted, marginBottom: 12, lineHeight: 20 }}>
              Đạt danh hiệu để mở khóa những trang giấy đầy màu sắc. Bấm 'Xem tất cả' hoặc chọn huy hiệu để xem thêm.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {achievements.filter(item => item.isUnlocked).map((item) => (
                <TouchableOpacity key={item.key} activeOpacity={0.8} onPress={() => openBadgeDetail(item)}>
                  <View style={{ marginRight: 16, alignItems: 'center', width: 130 }}>
                    <FlyingPageBadge achievement={item} />
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text, marginTop: 4, width: '100%', textAlign: 'center' }} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {achievements.filter(item => item.isUnlocked).length === 0 && !loadingAchievements && (
                <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', width: '100%', paddingVertical: 16 }}>
                  Bạn chưa mở khóa danh hiệu nào. Hãy tích cực học tập để mở khóa nhé!
                </Text>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '900',
  },
  headerTokenBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTokenText: {
    fontSize: 14,
    fontWeight: '900',
  },
  headerThemeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '800',
  },
  smallBlueBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  smallBlueBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  statsDashboardCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statDashboardCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValText: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  statLabelText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarCol: {
    alignItems: 'center',
    flex: 1,
  },
  calendarDayLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  calendarDateCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDateText: {
    fontSize: 18,
    fontWeight: '700',
  },
  activeDayDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  calendarDivider: {
    height: 1,
    marginVertical: 14,
  },
  streakFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakFooterCol: {
    flex: 1,
  },
  streakFooterLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  streakFooterValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFooterEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  streakFooterVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  weightProgressCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  weightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightHeaderLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  weightHeaderVal: {
    fontSize: 24,
    fontWeight: '900',
  },
  weightHeaderRight: {
    alignItems: 'flex-end',
  },
  weightMinMaxLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  lineChartContainer: {
    height: 140,
    position: 'relative',
    marginTop: 10,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderStyle: 'dashed',
  },
  chartPointsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  chartColContainer: {
    height: '100%',
    width: 28,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFillVisual: {
    width: 12,
    borderRadius: 6,
    alignItems: 'center',
    position: 'relative',
  },
  activeChartPointIndicator: {
    position: 'absolute',
    top: -8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerActivePointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  activePointValueBadge: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  activePointValueText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  chartDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  chartDateLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  bmiCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  bmiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiValText: {
    fontSize: 22,
    fontWeight: '900',
  },
  bmiCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bmiCategoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bmiCategoryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bmiScaleBar: {
    height: 8,
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 8,
  },
  bmiScaleSegment: {
    flex: 1,
    height: '100%',
  },
  bmiPointerArrow: {
    position: 'absolute',
    top: -12,
    width: 14,
    height: 14,
    marginLeft: -7,
  },
  bmiThresholdLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiThresholdText: {
    fontSize: 8,
    fontWeight: '800',
  },
  bmiDivider: {
    height: 1,
    marginVertical: 14,
  },
  heightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heightLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  heightVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  targetSelectorContainer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  targetSelectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  targetSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  targetOptionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  targetOptionText: {
    fontSize: 10,
    fontWeight: '900',
  },
  levelCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelSubTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  levelTitleText: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  expTextContainer: {
    alignItems: 'flex-end',
  },
  expText: {
    fontSize: 14,
    fontWeight: '900',
  },
  levelProgressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgesContainerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  horizontalScrollContent: {
    paddingRight: 16,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 20, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  detailSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 210,
  },
  detailLeftCol: {
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRightCol: {
    width: '60%',
    paddingLeft: 12,
  },
  detailBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBadgeName: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  detailBadgeDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
    opacity: 0.8,
  },
  detailProgressContainer: {
    marginBottom: 12,
  },
  detailProgressLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailProgressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 6,
  },
  detailProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailProgressText: {
    fontSize: 10,
    fontWeight: '900',
  },
  detailStatusContainer: {
    marginTop: 4,
  },
  detailStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statusBadgeUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextUnlocked: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22c55e',
    marginLeft: 4,
  },
  statusBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextLocked: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  bottomListTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomListScrollContent: {
    paddingVertical: 6,
  },
  thumbnailItem: {
    width: 124,
    alignItems: 'center',
    marginHorizontal: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  thumbnailText: {
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 4,
    width: '100%',
    textAlign: 'center',
  },
  filterPillsScrollContainer: {
    maxHeight: 48,
    marginBottom: 10,
    marginTop: 4,
  },
  filterPillsScrollContent: {
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  tokenUsageCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tokenRow: {
    marginVertical: 4,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tokenNameText: {
    fontSize: 13,
    fontWeight: '900',
  },
  tokenCountText: {
    fontSize: 14,
    fontWeight: '900',
  },
  tokenProgressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tokenProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tokenDivider: {
    height: 1,
    marginVertical: 14,
  },
  calendarHistoryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 6,
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
    fontSize: 13,
    fontWeight: '700',
  },
  monthGridActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 2,
  },
  weekGroupContainer: {
    marginBottom: 20,
  },
  weekGroupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekGroupLabel: {
    fontSize: 13.5,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyItemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyItemCenter: {
    flex: 1,
    justifyContent: 'center',
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
    fontSize: 10,
    fontWeight: '600',
  },
  historyItemDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  historyItemRight: {
    padding: 6,
    marginLeft: 4,
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
  tokenStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  tokenStatBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tokenIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tokenBoxVal: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 2,
  },
  tokenBoxLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  mainStatsHeaderCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  unifiedTokenCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  unifiedTokenLeft: {
    flex: 1,
    paddingRight: 8,
  },
  unifiedTokenTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  unifiedTokenSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  percentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  percentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  percentVal: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  percentLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  percentSlash: {
    fontSize: 26,
    fontWeight: '300',
    opacity: 0.5,
    marginHorizontal: 2,
  },
  historyLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  historyLinkText: {
    fontSize: 13,
    fontWeight: '900',
  },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 12,
  },
  detailHeaderBackBtn: {
    padding: 6,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
});




