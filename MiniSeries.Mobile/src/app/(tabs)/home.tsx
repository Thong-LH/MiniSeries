import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Dimensions, Animated, Easing, Platform, FlatList } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Lesson } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpaceBackground } from '../../components/SpaceBackground';
import { useTheme } from '../../hooks/use-theme';
import { LevelAvatar } from '../../components/LevelAvatar';
import { StripWhitespace } from '../../components/StripWhitespace';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const HOME_LESSONS_CACHE_KEY = 'cached_home_lessons';
const HOME_STALE_MS = 2 * 60 * 1000;

export default function HomeScreen() {
  const {
    themeId,
    setThemeId,
    lessons,
    setLessons,
    mangaTokens,
    videoTokens,
    setViewingLesson,
    setViewerPage,
    weeklyTarget,
    setWeeklyTarget,
    updateStatsFromData,
    isAuthenticated,
    refreshProfile,
    globalStreak,
    shouldRefreshHome,
    setShouldRefreshHome,
    triggerToast,
  } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

  const categories = ['Manga', 'Video', 'Hoàn thành', 'Đang xử lý'];
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('Manga');
  const [loading, setLoading] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [weekDays, setWeekDays] = useState<any[]>([]);
  const [showTargetSelector, setShowTargetSelector] = useState<boolean>(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Pager / Carousel state
  const [carouselLoading, setCarouselLoading] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Rotating logo animation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const selectorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();
  }, [rotateAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [floatAnim]);



  useEffect(() => {
    Animated.timing(selectorAnim, {
      toValue: showTargetSelector ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [showTargetSelector]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const selectorHeight = selectorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 52],
  });

  const selectorOpacity = selectorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.2, 1],
  });

  // Pulsing radiating aura animation (Breathing effect like web portal)
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Active breathing scale and opacity variations
  const scaleOuter = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.06],
  });
  const opacityOuter = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.40, 0.70], // breathes visibly without disappearing
  });
  // View More / Fullscreen overlay state
  const [showAllLessons, setShowAllLessons] = useState<boolean>(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [allLessonsPage, setAllLessonsPage] = useState<number>(1);
  const [allLessonsHasMore, setAllLessonsHasMore] = useState<boolean>(true);
  const [allLessonsSearch, setAllLessonsSearch] = useState<string>('');
  const [searchInputText, setSearchInputText] = useState<string>('');
  const [allLessonsFilter, setAllLessonsFilter] = useState<string>('Manga');
  const [allLessonsLoading, setAllLessonsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadCachedLessons = async () => {
      try {
        const cached = await AsyncStorage.getItem(HOME_LESSONS_CACHE_KEY);
        if (!cached) return;
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLessons(parsed);
        }
      } catch (e) {
        console.log('Lỗi đọc cache bài học home:', e);
      }
    };
    loadCachedLessons();
  }, []);

  const colors = useTheme();
  const isDark = colors.isDark;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setAllLessonsSearch(searchInputText);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInputText]);

  useEffect(() => {
    if (!showAllLessons) {
      setSearchInputText('');
      setAllLessonsSearch('');
    }
  }, [showAllLessons]);

  const toggleTheme = () => {
    setThemeId(isDark ? 'bold-typography' : 'bold-typography-dark');
  };

  const mapDtoToLesson = (dto: any): Lesson => {
    const isVideo = dto.outputMode === 1 || dto.outputMode === 'Video';
    const isApproved = dto.scriptStatus === 3 || dto.scriptStatus === 'Approved';
    const isMediaReady = dto.isMediaReady === true;

    let status: Lesson['status'] = 'Đang tạo';
    let progress = 45;
    if (isMediaReady) {
      status = 'Hoàn thành';
      progress = 100;
    } else if (isApproved) {
      status = 'Đang vẽ tranh...';
      progress = 85;
    }

    return {
      id: dto.id,
      title: dto.title,
      type: isVideo ? 'video' : 'manga',
      duration: '',
      status,
      progress,
      coverUrl: dto.thumbnailUrl || (isVideo
        ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600'
        : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600'),
      description: dto.creativeBrief || 'Bài giảng tạo tự động.'
    };
  };

  const fetchDashboardStats = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/progress/dashboard');
      if (res.data) {
        setStreak(res.data.currentStreak);
        setDashboardStats(res.data);
        updateStatsFromData(res.data);

        if (res.data.weeklyActivity && Array.isArray(res.data.weeklyActivity)) {
          const todayDate = new Date();
          const currentDayOfWeek = todayDate.getDay();
          const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
          const monday = new Date(todayDate);
          monday.setDate(todayDate.getDate() - distanceToMonday);

          const mappedDays = res.data.weeklyActivity.map((activity: any, idx: number) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + idx);
            return {
              dayNum: day.getDate(),
              isToday: day.toDateString() === todayDate.toDateString(),
              isActive: activity.isActive,
              dayLabel: activity.dayLabel
            };
          });
          setWeekDays(mappedDays);
        }
      }
    } catch (e) {
      console.log('Error fetching dashboard stats:', e);
    }
  };

  const fetchHomeLessons = async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent && lessons.length === 0) {
      setCarouselLoading(true);
    }
    try {
      const res = await apiClient.get('/lessons/my', {
        params: { page: 1, pageSize: 20 }
      });
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(mapDtoToLesson);
        setLessons(mapped);
        AsyncStorage.setItem(HOME_LESSONS_CACHE_KEY, JSON.stringify(mapped)).catch(() => {});
      }
    } catch (err) {
      console.log('Lỗi tải bài học carousel:', err);
    } finally {
      setCarouselLoading(false);
    }
  };

  const fetchAllLessons = async (pageToFetch = allLessonsPage) => {
    if (!isAuthenticated) return;
    setAllLessonsLoading(true);
    try {
      let outputModeParam: number | undefined = undefined;
      if (allLessonsFilter === 'Manga') outputModeParam = 0;
      if (allLessonsFilter === 'Video') outputModeParam = 1;

      let scriptStatusParam: number | undefined = undefined;
      if (allLessonsFilter === 'Hoàn thành') scriptStatusParam = 3;
      if (allLessonsFilter === 'Đang xử lý') scriptStatusParam = 0;

      const res = await apiClient.get('/lessons/my', {
        params: {
          page: pageToFetch,
          pageSize: 5,
          search: allLessonsSearch || undefined,
          outputMode: outputModeParam,
          scriptStatus: scriptStatusParam
        }
      });
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(mapDtoToLesson);
        setAllLessons(mapped);
        setAllLessonsHasMore(res.data.length === 5);
      }
    } catch (err) {
      console.log('Lỗi tải danh sách Xem thêm:', err);
    } finally {
      setAllLessonsLoading(false);
    }
  };

  useEffect(() => {
    // Generate week days dynamically fallback
    const todayDate = new Date();
    const currentDayOfWeek = todayDate.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(todayDate);
    monday.setDate(todayDate.getDate() - distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push({
        dayNum: day.getDate(),
        isToday: day.toDateString() === todayDate.toDateString()
      });
    }
    setWeekDays(days);
  }, []);

  useEffect(() => {
    if (showAllLessons) {
      if (allLessonsPage !== 1) {
        // Changing page to 1 will trigger the allLessonsPage effect below — avoid double fetch
        setAllLessonsPage(1);
      } else {
        // Page is already 1: fetch directly since allLessonsPage won't change
        fetchAllLessons(1);
      }
    }
  }, [allLessonsSearch, allLessonsFilter, showAllLessons]);

  useEffect(() => {
    if (showAllLessons) {
      fetchAllLessons(allLessonsPage);
    }
  }, [allLessonsPage]);

  const fetchHomeData = async (force = false) => {
    if (!isAuthenticated) return;
    try {
      const silent = lessons.length > 0 && !force;
      await Promise.all([
        fetchHomeLessons(silent),
        fetchDashboardStats(),
        refreshProfile()
      ]);
    } catch (e) {
      console.log('Error fetching home data:', e);
    }
  };

  // Consume shouldRefreshHome flag set by other tabs (e.g. create tab after lesson generated)
  useEffect(() => {
    if (shouldRefreshHome && isAuthenticated) {
      fetchHomeData(true);
      setShouldRefreshHome(false);
    }
  }, [shouldRefreshHome]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        const now = Date.now();
        // Chỉ refresh nền khi dữ liệu đã cũ — tránh gọi API mỗi lần đổi tab
        if (now - lastFetchTimeRef.current > HOME_STALE_MS) {
          lastFetchTimeRef.current = now;
          fetchHomeData(false);
        }
        apiClient.post('/analytics/track', { path: '/home', deviceType: 'Mobile' }).catch(() => { });
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // Record time so the concurrent focus event (fires on mount) is throttled out
      lastFetchTimeRef.current = Date.now();
      fetchHomeData(true);
    }
  }, [isAuthenticated]);

  const handleTabPress = (tabName: string) => {
    setActiveFilter(tabName);
    const index = categories.indexOf(tabName);
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const page = Math.round(contentOffset / SNAP_INTERVAL);
    if (page >= 0 && page < categories.length) {
      if (categories[page] !== activeFilter) {
        setActiveFilter(categories[page]);
      }
    }
  };

  const handleViewLesson = (lesson: Lesson) => {
    setViewingLesson(lesson);
    setViewerPage(1);
    if (lesson.status !== 'Hoàn thành') {
      router.push({
        pathname: '/review',
        params: { lessonId: lesson.id }
      });
    } else {
      router.push({
        pathname: '/lesson/[id]',
        params: { id: lesson.id, type: lesson.type }
      });
    }
  };

  const handleCreateNew = () => {
    router.replace('/(tabs)/create');
  };

  const activeDaysCount = weekDays.filter(d => d.isActive).length;
  const isTodayActive = weekDays.some(d => d.isToday && d.isActive);

  if (showAllLessons) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <SpaceBackground plain={true} />

        {/* Back Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setShowAllLessons(false)} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.brand, { color: colors.text }]}>TẤT CẢ BÀI HỌC</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[styles.headerThemeBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={allLessons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Search Bar */}
              <View style={[styles.searchSection, { marginBottom: 12 }]}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  placeholder="Tìm kiếm bài giảng..."
                  placeholderTextColor={colors.textMuted}
                  value={searchInputText}
                  onChangeText={setSearchInputText}
                  style={[styles.searchInput, { backgroundColor: isDark ? '#18181b' : '#f1f5f9', color: colors.text }]}
                />
              </View>

              {/* Categories / Filter Scroll */}
              <View style={[styles.filterSection, { marginBottom: 16 }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScrollContent}
                >
                  {categories.map((tab) => {
                    const active = allLessonsFilter === tab;
                    return (
                      <TouchableOpacity
                        key={tab}
                        activeOpacity={0.8}
                        onPress={() => setAllLessonsFilter(tab)}
                        style={[
                          styles.filterTab,
                          {
                            backgroundColor: active ? 'rgba(56, 189, 248, 0.15)' : colors.cardBg,
                            borderColor: active ? colors.primaryAccent : colors.border
                          }
                        ]}
                      >
                        <Text style={[styles.filterTabText, { color: active ? colors.primaryAccent : colors.text }]}>
                          {tab}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          }
          renderItem={({ item: lesson }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleViewLesson(lesson)}
              style={[styles.lessonRow, { backgroundColor: colors.cardBg, borderColor: colors.border, marginBottom: 12 }]}
            >
              <Image source={{ uri: lesson.coverUrl }} style={styles.rowImage} />
              <View style={styles.rowContent}>
                <View style={styles.rowHeader}>
                  <View style={[
                    styles.typeBadge,
                    {
                      backgroundColor: lesson.type === 'manga' ? colors.mangaBadgeBg : colors.videoBadgeBg,
                    }
                  ]}>
                    <Text style={[
                      styles.typeBadgeText,
                      { color: lesson.type === 'manga' ? colors.mangaAccent : colors.videoAccent }
                    ]}>
                      {lesson.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.rowStatusText,
                    { color: lesson.status === 'Hoàn thành' ? '#10b981' : '#f59e0b' }
                  ]}>
                    {lesson.status}
                  </Text>
                </View>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                  {lesson.title}
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]} numberOfLines={1}>
                  {lesson.description || 'Bài giảng được tạo tự động bởi AI.'}
                </Text>
                <View style={styles.rowProgressContainer}>
                  <View style={[styles.rowProgressBarBg, { backgroundColor: isDark ? '#27272a' : '#e4e4e7' }]}>
                    <View style={[
                      styles.rowProgressBarFill,
                      {
                        width: `${lesson.progress || 0}%`,
                        backgroundColor: colors.primaryAccent
                      }
                    ]} />
                  </View>
                  <Text style={[styles.rowProgressText, { color: colors.textMuted }]}>
                    {lesson.progress || 0}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            allLessonsLoading ? (
              <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginTop: 40 }} />
            ) : (
              <View style={[styles.emptyContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                <Ionicons name="folder-open-outline" size={40} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={{ color: colors.text, fontWeight: 'bold', marginBottom: 10, fontSize: 13 }}>Không tìm thấy bài học nào</Text>
              </View>
            )
          }
          ListFooterComponent={
            !allLessonsLoading && allLessons.length > 0 ? (
              <View style={[styles.paginationRow, { marginTop: 12, marginBottom: 20 }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={allLessonsPage === 1}
                  onPress={() => setAllLessonsPage((prev) => Math.max(1, prev - 1))}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: allLessonsPage === 1 ? 'transparent' : colors.cardBg,
                      borderColor: colors.border
                    }
                  ]}
                >
                  <Text style={[styles.pageBtnText, { color: allLessonsPage === 1 ? colors.textMuted : colors.text }]}>TRƯỚC</Text>
                </TouchableOpacity>

                <Text style={[styles.pageIndicator, { color: colors.text }]}>
                  {allLessonsPage}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={!allLessonsHasMore}
                  onPress={() => setAllLessonsPage((prev) => prev + 1)}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: !allLessonsHasMore ? 'transparent' : colors.primaryAccent,
                      borderColor: !allLessonsHasMore ? colors.border : colors.primaryAccent
                    }
                  ]}
                >
                  <Text style={[styles.pageBtnText, { color: !allLessonsHasMore ? colors.text : colors.buttonTextActive }]}>SAU</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </View>
    );
  }

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

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
        <Text style={[styles.brand, { color: colors.text }]}>MINISERIES</Text>

        <View style={styles.headerRightBadges}>
          {/* Streak Flame Badge */}
          <View style={[styles.streakBadge, { borderColor: colors.border, backgroundColor: colors.bg, paddingLeft: 6, paddingRight: 8 }]}>
            {renderStreakFlame(globalStreak, 13)}
            <Text style={[styles.streakText, { color: colors.text, marginLeft: 3 }]}>{globalStreak}</Text>
          </View>


          {/* Gamified Level Avatar with Circular Progress */}
          <LevelAvatar />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StripWhitespace>

        {/* Weekly Goal Calendar Card (Redesigned for Depth & Value) */}
        <View style={[styles.weeklyGoalCard, { backgroundColor: colors.cardBg, borderColor: colors.border, position: 'relative' }]}>

          {/* Logo wrapper at top-left corner */}
          <View style={styles.logoWrapper}>
            {/* Smooth Glowing Radial Gradient Aura (Fades out beautifully as one smooth circle like on web) */}
            <Animated.View
              style={[
                styles.goalLogoCircle,
                {
                  transform: [{ scale: scaleOuter }],
                  opacity: opacityOuter
                }
              ]}
            />

            {/* The White Rectangular Flying Paper Page spinning in 3D with 3D tilt and floating (Independent sibling) */}
            <Animated.View style={[
              styles.flyingPaperPage,
              {
                transform: [
                  { translateY: floatInterpolate },
                  { rotateY: rotateInterpolate },
                  { rotateX: '12deg' },
                  { rotateZ: '-6deg' }
                ]
              }
            ]}>
              <Image
                source={require('../../../assets/images/project-logo-v2.png')}
                style={styles.goalLogoImage}
              />
            </Animated.View>
          </View>

          <View style={[styles.weeklyGoalHeader, { paddingLeft: 68, marginBottom: 8 }]}>
            <View>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                STUDIO KHỞI TẠO
              </Text>
              <Text style={[styles.weeklyGoalTitle, { color: colors.text, fontSize: 16, marginTop: 2 }]}>
                Studio Sáng Tạo
              </Text>
            </View>
          </View>

          {/* Tokens Row */}
          <View style={{ paddingLeft: 68, flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              borderColor: 'rgba(99, 102, 241, 0.2)',
              borderWidth: 1,
              borderRadius: 8,
              paddingVertical: 4,
              paddingHorizontal: 8,
              gap: 4
            }}>
              <Ionicons name="book" size={10} color="#6366f1" />
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>
                {mangaTokens} Truyện
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(251, 146, 60, 0.1)' : 'rgba(251, 146, 60, 0.05)',
              borderColor: 'rgba(251, 146, 60, 0.2)',
              borderWidth: 1,
              borderRadius: 8,
              paddingVertical: 4,
              paddingHorizontal: 8,
              gap: 4
            }}>
              <Ionicons name="film" size={10} color="#fb923c" />
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>
                {videoTokens} Video
              </Text>
            </View>
          </View>

          {/* Action button */}
          <View style={{ paddingLeft: 68 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/create')}
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primaryAccent,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 10,
                gap: 6,
                shadowColor: colors.primaryAccent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3
              }}
            >
              <Ionicons name="add-circle" size={14} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
                TẠO BÀI HỌC MỚI
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gamified Study Challenge Card */}
        <View style={[styles.challengeCard, { backgroundColor: isDark ? '#1e1b4b' : '#3b82f6' }]}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>THỬ THÁCH HỌC TẬP 7 NGÀY</Text>
            <Text style={styles.challengeSub}>
              Hoàn thành bài học nhận +15 EXP mỗi ngày. Đã nhận: {streak * 15} EXP.
            </Text>

            {/* Interactive Step Progress Circles */}
            <View style={styles.challengeProgressRow}>
              {Array.from({ length: 7 }).map((_, idx) => {
                const isCompleted = idx < streak;
                const isCurrent = idx === (streak % 7);
                return (
                  <View key={idx} style={styles.challengeStepCol}>
                    <View style={[
                      styles.challengeStepCircle,
                      isCompleted && { backgroundColor: '#fb923c', borderColor: '#fb923c' },
                      isCurrent && { borderColor: '#ffffff', borderWidth: 1.5, borderStyle: 'dashed' }
                    ]}>
                      {isCompleted ? (
                        <Text style={{ fontSize: 16 }}>🔥</Text>
                      ) : isCurrent ? (
                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>+15</Text>
                      ) : (
                        <Ionicons name="lock-closed" size={13} color="rgba(255, 255, 255, 0.4)" />
                      )}
                    </View>
                    <Text style={styles.challengeStepLabel}>N{idx + 1}</Text>
                  </View>
                );
              })}
            </View>

            {isTodayActive ? (
              <View style={[styles.challengeSuccessBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <Text style={styles.challengeSuccessText}>ĐÃ HOÀN THÀNH HÔM NAY! 🎉</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCreateNew}
                style={styles.challengeBtn}
              >
                <Text style={[styles.challengeBtnText, { color: isDark ? '#1e1b4b' : '#3b82f6' }]}>HỌC NGAY HÔM NAY (+15 EXP)</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.challengeIconContainer}>
            <Ionicons name="flash" size={64} color="rgba(255, 255, 255, 0.15)" />
          </View>
        </View>

        {/* Categories / Filter Scroll */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh mục bài giảng</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {categories.map((tab) => {
              const active = activeFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.8}
                  onPress={() => handleTabPress(tab)}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: active ? 'rgba(56, 189, 248, 0.15)' : colors.cardBg,
                      borderColor: active ? colors.primaryAccent : colors.border
                    }
                  ]}
                >
                  <Text style={[styles.filterTabText, { color: active ? colors.primaryAccent : colors.text }]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Horizontal Carousel Pager */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{
            paddingLeft: 16,
            paddingRight: width - CARD_WIDTH - 16
          }}
          style={{ marginHorizontal: -16 }}
        >
          {categories.map((cat, catIdx) => {
            const filtered = lessons.filter(l => {
              if (cat === 'Manga') return l.type === 'manga';
              if (cat === 'Video') return l.type === 'video';
              if (cat === 'Hoàn thành') return l.status === 'Hoàn thành';
              return l.status !== 'Hoàn thành'; // 'Đang xử lý'
            });
            const sliced = filtered.slice(0, 3);

            return (
              <View
                key={cat}
                style={{
                  width: CARD_WIDTH,
                  marginRight: CARD_GAP
                }}
              >
                <View style={[
                  styles.carouselCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  }
                ]}>
                  {carouselLoading ? (
                    <View style={styles.carouselEmptyContainer}>
                      <ActivityIndicator size="small" color={colors.primaryAccent} />
                      <Text style={[styles.carouselEmptyText, { color: colors.textMuted, marginTop: 8 }]}>Đang tải...</Text>
                    </View>
                  ) : sliced.length === 0 ? (
                    <View style={styles.carouselEmptyContainer}>
                      <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
                      <Text style={[styles.carouselEmptyText, { color: colors.textMuted }]}>Chưa có bài giảng nào</Text>
                    </View>
                  ) : (
                    <View style={styles.carouselCardList}>
                      {sliced.map((lesson, idx) => (
                        <TouchableOpacity
                          key={lesson.id}
                          activeOpacity={0.8}
                          onPress={() => handleViewLesson(lesson)}
                          style={[
                            styles.carouselRow,
                            idx < sliced.length - 1 && { borderBottomWidth: 0.8, borderBottomColor: colors.border }
                          ]}
                        >
                          <Image source={{ uri: lesson.coverUrl }} style={styles.carouselRowImage} />
                          <View style={styles.carouselRowContent}>
                            <Text style={[styles.carouselRowTitle, { color: colors.text }]} numberOfLines={1}>
                              {lesson.title}
                            </Text>
                            <Text style={[styles.carouselRowDesc, { color: colors.textMuted }]} numberOfLines={1}>
                              {lesson.type.toUpperCase()} • {lesson.status} • Chương 1/1
                            </Text>

                            {/* Larger Inline Progress Bar */}
                            <View style={styles.rowProgressContainer}>
                              <View style={[styles.rowProgressBarBg, { backgroundColor: isDark ? '#27272a' : '#e4e4e7' }]}>
                                <View style={[
                                  styles.rowProgressBarFill,
                                  {
                                    width: `${lesson.progress || 0}%`,
                                    backgroundColor: colors.primaryAccent
                                  }
                                ]} />
                              </View>
                              <Text style={[styles.rowProgressText, { color: colors.textMuted }]}>
                                {lesson.progress || 0}%
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {filtered.length > 3 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setAllLessonsFilter(cat);
                        setShowAllLessons(true);
                      }}
                      style={styles.carouselCardMoreBtn}
                    >
                      <Text style={[styles.carouselCardMoreText, { color: colors.primaryAccent }]}>Xem thêm ›</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Explore More Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setAllLessonsFilter('Tất cả');
            setShowAllLessons(true);
          }}
          style={[styles.exploreBannerCard, { backgroundColor: isDark ? '#18181b' : '#f1f5f9', borderColor: colors.border }]}
        >
          <View style={styles.exploreBannerContent}>
            <Text style={[styles.exploreBannerTitle, { color: colors.text }]}>Khám phá thêm bài giảng</Text>
            <Text style={[styles.exploreBannerSub, { color: colors.textMuted }]}>Tìm kiếm, lọc và phân trang toàn bộ bài giảng</Text>
          </View>
          <View style={[styles.exploreBannerGoBtn, { backgroundColor: colors.primaryAccent }]}>
            <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 10 }}>ĐI</Text>
          </View>
        </TouchableOpacity>
        </StripWhitespace>
      </ScrollView>
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
    padding: 18,
    paddingBottom: 40,
  },
  searchSection: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 10,
  },
  searchInput: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 36,
    paddingRight: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  weeklyGoalCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoWrapper: {
    position: 'absolute',
    left: -14,
    top: -26,
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  goalLogoCircle: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#3b82f6',
    zIndex: 1,
    ...Platform.select({
      web: {
        // @ts-ignore - filter is supported on web platform for React Native Web
        filter: 'blur(3px)',
        WebkitFilter: 'blur(3px)',
      },
      default: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 2,
      }
    })
  },
  flyingPaperPage: {
    position: 'absolute',
    width: 36,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  goalLogoImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  weeklyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  weeklyGoalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  weeklyGoalTargetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyGoalTargetText: {
    fontSize: 16,
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
  weeklyDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyDayCol: {
    alignItems: 'center',
    gap: 4,
  },
  weeklyDayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weeklyDayLabelText: {
    fontSize: 8,
    fontWeight: '800',
  },
  challengeCard: {
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeInfo: {
    flex: 1.2,
    zIndex: 2,
    width: '100%',
  },
  challengeTitle: {
    color: '#ffffff',
    fontSize: 18.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  challengeSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
  },
  challengeProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '90%',
  },
  challengeStepCol: {
    alignItems: 'center',
    gap: 6,
  },
  challengeStepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  challengeStepLabel: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '800',
  },
  challengeSuccessBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  challengeSuccessText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '900',
  },
  challengeBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  challengeBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  challengeIconContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.8,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  filtersScrollContent: {
    gap: 8,
  },
  filterTab: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  filterTabText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  listContainer: {
    gap: 12,
  },
  lessonRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  rowStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  rowDesc: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  rowProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  rowProgressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rowProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rowProgressText: {
    fontSize: 9,
    fontWeight: '800',
    width: 28,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  pageBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  pageBtnText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pageIndicator: {
    fontSize: 11,
    fontWeight: '900',
  },
  carouselCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    minHeight: 210,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  carouselEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  carouselEmptyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  carouselCardList: {
    gap: 12,
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  carouselRowImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  carouselRowContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  carouselRowTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  carouselRowDesc: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  carouselCardMoreBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  carouselCardMoreText: {
    fontSize: 14,
    fontWeight: '900',
  },
  exploreBannerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  exploreBannerContent: {
    flex: 1,
    marginRight: 12,
  },
  exploreBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  exploreBannerSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
  exploreBannerGoBtn: {
    width: 38,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
