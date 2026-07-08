import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, Animated, Easing, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/use-theme';
import { SpaceBackground } from '../../components/SpaceBackground';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { useNavigation, useRouter } from 'expo-router';
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
    globalStreak
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
  const [showTargetSelector, setShowTargetSelector] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const selectorAnim = useRef(new Animated.Value(0)).current;
  const flyAnim = useRef(new Animated.Value(0)).current;
  const detailFloatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(detailFloatAnim, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(detailFloatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const changeSelectedBadge = (badge: Achievement) => {
    // 1. Fly out to the left
    Animated.timing(flyAnim, {
      toValue: -320,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      // 2. Set new badge state
      setSelectedBadge(badge);
      // 3. Teleport to offscreen right
      flyAnim.setValue(320);
      // 4. Fly in from the right to resting center position (0)
      Animated.spring(flyAnim, {
        toValue: 0,
        friction: 6.5,
        tension: 38,
        useNativeDriver: true,
      }).start();
    });
  };

  const openBadgeDetail = (badge: Achievement) => {
    setSelectedBadge(badge);
    setShowDetailsModal(true);
    flyAnim.setValue(0);
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

  const fetchDashboardStats = async () => {
    setLoading(true);
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
    setLoadingAchievements(true);
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardStats();
      fetchAchievements();
    });
    return unsubscribe;
  }, [navigation]);
  useEffect(() => {
    fetchDashboardStats();
    fetchAchievements();
  }, []);
  // Generate date numbers for the weekly calendar row based on current week
  const getWeeklyCalendar = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    // Shift to start on Sunday (CN) like in the screenshot
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() - 1);

    const weekLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return weekLabels.map((label, idx) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + idx);
      const isToday = date.toDateString() === today.toDateString();
      
      // Try to find if this day was active in stats.weeklyActivity
      const activity = stats.weeklyActivity.find(a => a.dayLabel === label);

      return {
        dayLabel: label,
        dateNum: date.getDate(),
        isToday,
        isActive: activity ? activity.isActive : false
      };
    });
  };

  const calendarDays = getWeeklyCalendar();

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

  // EXP thăng cấp percentage
  const currentLevelExp = stats.totalExp ?? 0;
  const levelMinExp = stats.prevLevelExp ?? 0;
  const levelMaxExp = stats.nextLevelExp ?? 100;
  const expProgress = currentLevelExp - levelMinExp;
  const expRange = Math.max(1, levelMaxExp - levelMinExp);
  const expPercentage = Math.min(100, Math.max(0, (expProgress * 100) / expRange));

  // Sắp xếp huy hiệu: đã đạt được lên đầu, chưa đạt được xếp sau theo bộ
  const getSortedAchievements = () => {
    return [...achievements].sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      return a.category.localeCompare(b.category);
    });
  };

  const modalAchievementsList = getSortedAchievements().filter(item => {
    if (activeFilter === 'All') return true;
    return item.category === activeFilter;
  });

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

          <View style={[styles.headerTokenBadge, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Ionicons name="book-outline" size={12} color={colors.text} style={{ marginRight: 2 }} />
            <Text style={[styles.headerTokenText, { color: colors.text }]}>
              {mangaTokens > 1000 ? '∞' : mangaTokens}
            </Text>
            <Text style={{ color: colors.textMuted, marginHorizontal: 4, fontSize: 10 }}>|</Text>
            <Ionicons name="film-outline" size={12} color={colors.text} style={{ marginRight: 2 }} />
            <Text style={[styles.headerTokenText, { color: colors.text }]}>
              {videoTokens}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[styles.headerThemeBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={14} color={colors.text} />
          </TouchableOpacity>

          {/* Gamified Level Avatar with Circular Progress */}
          <LevelAvatar />
        </View>
      </View>

      {loading && stats.totalLessons === 0 ? (
        <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginTop: 80 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>BÁO CÁO</Text>

          {/* Level & EXP Progress Bar Card */}
          <View style={[styles.levelCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.levelHeaderRow}>
              <View>
                <Text style={[styles.levelSubTitle, { color: colors.textMuted }]}>CẤP ĐỘ HIỆN TẠI</Text>
                <Text style={[styles.levelTitleText, { color: colors.primaryAccent }]}>
                  Lv.{stats.currentLevel ?? 1} • {stats.levelLabel ?? 'Tập sự'}
                </Text>
              </View>
              <View style={styles.expTextContainer}>
                <Text style={[styles.expText, { color: colors.text }]}>
                  {stats.totalExp ?? 0} <Text style={{ color: colors.textMuted, fontSize: 10 }}>/ {stats.nextLevelExp ?? 100} EXP</Text>
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
              {stats.totalExp && stats.totalExp >= 1500 ? 'Chúc mừng! Bạn đã đạt Cấp độ tối đa.' : `Cần thêm ${Math.max(0, (stats.nextLevelExp ?? 100) - (stats.totalExp ?? 0))} EXP để thăng cấp tiếp theo.`}
            </Text>
          </View>

          {/* Section 1: Dashboard Stats Card */}
          <View style={[styles.statsDashboardCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.statDashboardCol}>
              <Ionicons name="medal-outline" size={24} color="#6366f1" />
              <Text style={[styles.statValText, { color: colors.text }]}>{stats.completedLessons}</Text>
              <Text style={[styles.statLabelText, { color: colors.textMuted }]}>Bài giảng</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statDashboardCol}>
              <Ionicons name="flash-outline" size={24} color="#fb923c" />
              <Text style={[styles.statValText, { color: colors.text }]}>{mangaTokens + videoTokens}</Text>
              <Text style={[styles.statLabelText, { color: colors.textMuted }]}>Tokens</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statDashboardCol}>
              <Ionicons name="time-outline" size={24} color="#38bdf8" />
              <Text style={[styles.statValText, { color: colors.text }]}>{stats.totalStudyMinutes}</Text>
              <Text style={[styles.statLabelText, { color: colors.textMuted }]}>Phút học</Text>
            </View>
          </View>

          {/* Section 2: Lịch sử (Weekly Calendar & Streak) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Lịch sử học tập</Text>
          </View>

          <View style={[styles.historyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.calendarRow}>
              {calendarDays.map((day, index) => (
                <View key={index} style={styles.calendarCol}>
                  <Text style={[styles.calendarDayLabel, { color: colors.textMuted }]}>{day.dayLabel}</Text>
                  <View style={[
                    styles.calendarDateCircle,
                    day.isToday && { borderColor: colors.primaryAccent, borderWidth: 1.5 },
                    day.isActive && { backgroundColor: 'rgba(99, 102, 241, 0.15)' }
                  ]}>
                    <Text style={[
                      styles.calendarDateText, 
                      { color: day.isToday ? colors.primaryAccent : colors.text },
                      day.isActive && { color: '#6366f1', fontWeight: '900' }
                    ]}>
                      {day.dateNum}
                    </Text>
                    {day.isActive && <View style={styles.activeDayDot} />}
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.calendarDivider, { backgroundColor: colors.border }]} />

            <View style={styles.streakFooterRow}>
              <View style={styles.streakFooterCol}>
                <Text style={[styles.streakFooterLabel, { color: colors.textMuted }]}>Ngày liên tiếp</Text>
                <View style={styles.streakFooterValRow}>
                  {renderStreakFlame(stats.currentStreak, 18)}
                  <Text style={[styles.streakFooterVal, { color: colors.text, marginLeft: 6 }]}>{stats.currentStreak}</Text>
                </View>
              </View>
              <View style={styles.streakFooterCol}>
                <Text style={[styles.streakFooterLabel, { color: colors.textMuted }]}>Tốt nhất của Cá nhân</Text>
                <Text style={[styles.streakFooterVal, { color: colors.text }]}>{stats.longestStreak} Ngày</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Tiến độ bài giảng (Cumulative Graph) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Tiến độ</Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.replace('/(tabs)/create')}
              style={[styles.smallBlueBtn, { backgroundColor: colors.primaryAccent }]}
            >
              <Text style={styles.smallBlueBtnText}>Học ngay</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.weightProgressCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.weightHeaderRow}>
              <View>
                <Text style={[styles.weightHeaderLabel, { color: colors.textMuted }]}>Hiện tại</Text>
                <Text style={[styles.weightHeaderVal, { color: colors.text }]}>{stats.completedLessons} bài giảng</Text>
              </View>
              <View style={styles.weightHeaderRight}>
                <Text style={[styles.weightMinMaxLabel, { color: colors.textMuted }]}>Nhiều nhất: {stats.totalLessons}</Text>
                <Text style={[styles.weightMinMaxLabel, { color: colors.textMuted }]}>Ít nhất: 0</Text>
              </View>
            </View>

            {/* Custom styled Line Chart grid using CSS absolute points from real DB activityCount */}
            <View style={styles.lineChartContainer}>
              {/* Horizontal dotted lines */}
              <View style={[styles.gridLine, { top: '0%' }]} />
              <View style={[styles.gridLine, { top: '25%' }]} />
              <View style={[styles.gridLine, { top: '50%' }]} />
              <View style={[styles.gridLine, { top: '75%' }]} />
              <View style={[styles.gridLine, { top: '100%' }]} />

              {/* Data points & connecting visual bars */}
              <View style={styles.chartPointsRow}>
                {stats.weeklyActivity.map((day, idx) => {
                  const heightVal = Math.min(90, Math.max(15, 15 + (day.activityCount ?? 0) * 25));
                  const isToday = calendarDays[idx]?.isToday;
                  return (
                    <View key={idx} style={styles.chartColContainer}>
                      <View style={[
                        styles.barFillVisual, 
                        { 
                          height: `${heightVal}%`, 
                          backgroundColor: isToday ? 'rgba(99, 102, 241, 0.3)' : 'rgba(148, 163, 184, 0.15)',
                          borderColor: isToday ? '#6366f1' : '#94a3b8',
                          borderWidth: 1,
                        }
                      ]}>
                        {isToday && (
                          <View style={styles.activeChartPointIndicator}>
                            <View style={styles.innerActivePointDot} />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Highlight Label Badge on Active Point */}
              <View style={[styles.activePointValueBadge, { left: '80%' }]}>
                <Text style={styles.activePointValueText}>{stats.completedLessons}.0</Text>
              </View>
            </View>

            <View style={styles.chartDatesRow}>
              {stats.weeklyActivity.map((day, idx) => {
                let dateStr = '--';
                if (day.dateStr) {
                  const parts = day.dateStr.split('-');
                  dateStr = parts[parts.length - 1];
                }
                return (
                  <Text key={idx} style={[styles.chartDateLabel, { color: colors.textMuted }]}>{dateStr}</Text>
                );
              })}
            </View>
          </View>



          {/* Section 5: Huy hiệu Trang giấy bay (Flying Page Badges) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Huy hiệu Trang giấy bay</Text>
            <TouchableOpacity onPress={() => {
              if (achievements.length > 0) {
                openBadgeDetail(achievements[0]);
              } else {
                setShowDetailsModal(true);
              }
            }}>
              <Text style={{ color: colors.primaryAccent, fontSize: 12, fontWeight: '800' }}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.badgesContainerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12, lineHeight: 16 }}>
              Mỗi danh hiệu mở khóa một trang giấy bay độc nhất lơ lửng đầy màu sắc. Ấn "Xem tất cả" hoặc nhấn vào huy hiệu để xem chi tiết.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {achievements.filter(item => item.isUnlocked).map((item) => (
                <TouchableOpacity key={item.key} activeOpacity={0.8} onPress={() => openBadgeDetail(item)}>
                  <View style={{ marginRight: 16, alignItems: 'center', width: 80 }}>
                    <FlyingPageBadge achievement={item} />
                    <Text style={{ fontSize: 9, fontWeight: '800', color: colors.text, marginTop: 4, width: '100%', textAlign: 'center' }} numberOfLines={1}>
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

          {/* Modal Xem chi tiết danh hiệu */}
          <Modal
            visible={showDetailsModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDetailsModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Danh hiệu Trang giấy bay</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {selectedBadge ? (
                  <>
                    {/* Split content row */}
                    <View style={styles.detailSplitRow}>
                      {/* Left: Animated Floating Badge */}
                      <View style={styles.detailLeftCol}>
                        <Animated.View style={[
                          styles.detailBadgeContainer,
                          {
                            transform: [
                              { translateX: flyAnim },
                              { translateY: detailFloatAnim }
                            ]
                          }
                        ]}>
                          <FlyingPageBadge achievement={selectedBadge} />
                        </Animated.View>
                      </View>

                      {/* Right: Badge Details */}
                      <View style={styles.detailRightCol}>
                        <Text style={[styles.detailBadgeName, { color: colors.primaryAccent }]}>
                          {selectedBadge.name}
                        </Text>
                        <Text style={[styles.detailBadgeDesc, { color: colors.text }]}>
                          {selectedBadge.description}
                        </Text>

                        {/* Progress */}
                        <View style={styles.detailProgressContainer}>
                          <Text style={[styles.detailProgressLabel, { color: colors.textMuted }]}>Tiến độ hiện tại</Text>
                          <View style={styles.progressRow}>
                            <View style={[styles.detailProgressBarBg, { backgroundColor: colors.border }]}>
                              <View style={[
                                styles.detailProgressBarFill,
                                {
                                  backgroundColor: colors.primaryAccent,
                                  width: `${Math.min(100, (selectedBadge.currentProgress * 100) / Math.max(1, selectedBadge.targetProgress))}%`
                                }
                              ]} />
                            </View>
                            <Text style={[styles.detailProgressText, { color: colors.text }]}>
                              {selectedBadge.currentProgress} / {selectedBadge.targetProgress}
                            </Text>
                          </View>
                        </View>

                        {/* Status / Date */}
                        <View style={styles.detailStatusContainer}>
                          <Text style={[styles.detailStatusLabel, { color: colors.textMuted }]}>Trạng thái</Text>
                          {selectedBadge.isUnlocked ? (
                            <View style={styles.statusBadgeUnlocked}>
                              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                              <Text style={styles.statusTextUnlocked}>
                                Đã mở khóa ({selectedBadge.unlockedAt ? new Date(selectedBadge.unlockedAt).toLocaleDateString('vi-VN') : 'Gần đây'})
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.statusBadgeLocked}>
                              <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                              <Text style={[styles.statusTextLocked, { color: colors.textMuted }]}>Chưa mở khóa</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Bottom: List of achievements as thumbnails */}
                    <Text style={[styles.bottomListTitle, { color: colors.textMuted }]}>Chọn danh hiệu để xem chi tiết:</Text>
                    
                    {/* Category Filter Pills (Horizontal Scroll) */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.filterPillsScrollContent}
                      style={styles.filterPillsScrollContainer}
                    >
                      {['All', 'Streak', 'Lessons', 'Minutes', 'Quiz', 'Level'].map((cat) => {
                        const labelMap: Record<string, string> = {
                          All: 'Tất cả',
                          Streak: 'Chuyên cần',
                          Lessons: 'Bài giảng',
                          Minutes: 'Thời gian',
                          Quiz: 'Luyện tập',
                          Level: 'Cấp độ',
                        };
                        const isActive = activeFilter === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveFilter(cat)}
                            style={[
                              styles.filterPill,
                              isActive && { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent }
                            ]}
                          >
                            <Text style={[
                              styles.filterPillText,
                              { color: isActive ? '#ffffff' : colors.textMuted }
                            ]}>
                              {labelMap[cat]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.bottomListScrollContent}
                    >
                      {modalAchievementsList.map((item) => {
                        const isSelected = selectedBadge.key === item.key;
                        return (
                          <TouchableOpacity
                            key={item.key}
                            onPress={() => changeSelectedBadge(item)}
                            style={styles.thumbnailItem}
                          >
                            <FlyingPageBadge achievement={item} isSelected={isSelected} />
                            <Text style={[
                              styles.thumbnailText,
                              { color: isSelected ? colors.primaryAccent : colors.textMuted }
                            ]} numberOfLines={1}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {modalAchievementsList.length === 0 && (
                        <Text style={{ color: colors.textMuted, fontSize: 11, paddingVertical: 12, paddingHorizontal: 8 }}>
                          Không tìm thấy danh hiệu thuộc nhóm này.
                        </Text>
                      )}
                    </ScrollView>
                  </>
                ) : (
                  <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginVertical: 50 }} />
                )}
              </View>
            </View>
          </Modal>

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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 12,
    marginRight: 2,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '900',
  },
  headerTokenBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTokenText: {
    fontSize: 11,
    fontWeight: '900',
  },
  headerThemeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  calendarDateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeDayDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
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
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  streakFooterValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFooterEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakFooterVal: {
    fontSize: 16,
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
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  weightHeaderVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  weightHeaderRight: {
    alignItems: 'flex-end',
  },
  weightMinMaxLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  lineChartContainer: {
    height: 100,
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
    width: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFillVisual: {
    width: 8,
    borderRadius: 4,
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
    fontSize: 9,
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
    minHeight: 160,
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
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomListScrollContent: {
    paddingVertical: 6,
  },
  thumbnailItem: {
    width: 76,
    alignItems: 'center',
    marginHorizontal: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  thumbnailText: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
    width: '100%',
    textAlign: 'center',
  },
  filterPillsScrollContainer: {
    maxHeight: 38,
    marginBottom: 10,
    marginTop: 4,
  },
  filterPillsScrollContent: {
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
