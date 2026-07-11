import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator, 
  Platform,
  Animated,
  Easing
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';
import { SpaceBackground } from '../components/SpaceBackground';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/apiClient';
import { FlyingPageBadge, Achievement } from '../components/FlyingPageBadge';

const { width } = Dimensions.get('window');

export default function AchievementsScreen() {
  const { isAuthenticated } = useApp();
  const colors = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedKey?: string }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Animation values
  const flyAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Floating animation for selected badge
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  // Fetch achievements from API
  const fetchAchievements = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/progress/achievements');
      if (res.data && Array.isArray(res.data)) {
        setAchievements(res.data);
        
        // Match initially selected badge from parameter key or default to first
        const initialKey = params.selectedKey;
        const matched = res.data.find((item: Achievement) => item.key === initialKey);
        if (matched) {
          setSelectedBadge(matched);
        } else if (res.data.length > 0) {
          setSelectedBadge(res.data[0]);
        }
      }
    } catch (e) {
      console.log('Lỗi tải danh hiệu từ API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [isAuthenticated, params.selectedKey]);

  // Handle selected badge change with sliding animation
  const handleSelectBadge = (badge: Achievement) => {
    if (selectedBadge?.key === badge.key) return;

    Animated.timing(flyAnim, {
      toValue: -width,
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setSelectedBadge(badge);
      flyAnim.setValue(width);
      Animated.spring(flyAnim, {
        toValue: 0,
        friction: 7.5,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
  };

  // Filter achievements list by category
  const filteredAchievements = achievements.filter(item => {
    if (activeFilter === 'All') return true;
    return item.category.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <View style={styles.container}>
      <SpaceBackground plain />

      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderMuted }]}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.08)' }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>DANH HIỆU & HUY HIỆU</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tải bộ sưu tập...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Detailed Selected Badge Card */}
          {selectedBadge && (
            <View style={[styles.detailCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={styles.detailSplitRow}>
                {/* Left: Badge Display */}
                <View style={styles.detailLeftCol}>
                  <Animated.View style={[
                    styles.detailBadgeContainer,
                    {
                      transform: [
                        { translateX: flyAnim },
                        { translateY: floatAnim }
                      ]
                    }
                  ]}>
                    <FlyingPageBadge achievement={selectedBadge} />
                  </Animated.View>
                </View>

                {/* Right: Details Text & Progress */}
                <View style={styles.detailRightCol}>
                  <Text style={[styles.badgeCategory, { color: colors.primaryAccent }]}>
                    {selectedBadge.category.toUpperCase()}
                  </Text>
                  <Text style={[styles.detailBadgeName, { color: colors.text }]}>
                    {selectedBadge.name}
                  </Text>
                  <Text style={[styles.detailBadgeDesc, { color: colors.textMuted }]}>
                    {selectedBadge.description}
                  </Text>

                  {/* Progress bar */}
                  <View style={styles.detailProgressContainer}>
                    <Text style={[styles.detailProgressLabel, { color: colors.textMuted }]}>Tiến độ nhiệm vụ</Text>
                    <View style={styles.progressRow}>
                      <View style={[styles.detailProgressBarBg, { backgroundColor: colors.borderMuted }]}>
                        <View style={[
                          styles.detailProgressBarFill,
                          {
                            backgroundColor: colors.primaryAccent,
                            width: `${Math.min(100, (selectedBadge.currentProgress * 100) / Math.max(1, selectedBadge.targetProgress))}%`
                          }
                        ]} />
                      </View>
                      <Text style={[styles.detailProgressText, { color: colors.text }]}>
                        {selectedBadge.currentProgress}/{selectedBadge.targetProgress}
                      </Text>
                    </View>
                  </View>

                  {/* Status Indicator */}
                  <View style={styles.detailStatusContainer}>
                    {selectedBadge.isUnlocked ? (
                      <View style={styles.statusBadgeUnlocked}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.secondaryAccent} />
                        <Text style={[styles.statusTextUnlocked, { color: colors.secondaryAccent }]}>
                          Đã mở khóa ({selectedBadge.unlockedAt ? new Date(selectedBadge.unlockedAt).toLocaleDateString('vi-VN') : 'Mới đây'})
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadgeLocked}>
                        <Ionicons name="lock-closed" size={15} color={colors.textMuted} />
                        <Text style={[styles.statusTextLocked, { color: colors.textMuted }]}>Chưa mở khóa</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Section List Header & Filter Pills */}
          <Text style={[styles.gridTitle, { color: colors.text }]}>BỘ SƯU TẬP HUY HIỆU</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScrollContent}
            style={styles.filterPillsScrollContainer}
          >
            {['All', 'Streak', 'Lessons', 'Minutes', 'Quiz', 'Level', 'Token'].map((cat) => {
              const labelMap: Record<string, string> = {
                All: 'Tất cả',
                Streak: 'Chuyên cần',
                Lessons: 'Bài giảng',
                Minutes: 'Thời gian',
                Quiz: 'Luyện tập',
                Level: 'Cấp độ',
                Token: 'Token',
              };
              const isActive = activeFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setActiveFilter(cat)}
                  style={[
                    styles.filterPill,
                    { backgroundColor: isActive ? colors.primaryAccent : colors.cardBg, borderColor: colors.border },
                    isActive && { borderColor: colors.primaryAccent }
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

          {/* Badge Grid of All achievements */}
          <View style={styles.gridContainer}>
            {filteredAchievements.map((item) => {
              const isSelected = selectedBadge?.key === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  onPress={() => handleSelectBadge(item)}
                  style={[
                    styles.gridItem,
                    { 
                      backgroundColor: colors.cardBg, 
                      borderColor: isSelected ? colors.primaryAccent : colors.border,
                      opacity: item.isUnlocked ? 1 : 0.65 
                    }
                  ]}
                >
                  <View style={styles.badgeThumbnailWrapper}>
                    <FlyingPageBadge achievement={item} isSelected={isSelected} />
                  </View>
                  <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {!item.isUnlocked && (
                    <View style={[styles.lockIconOverlay, { backgroundColor: 'rgba(9, 9, 11, 0.4)' }]}>
                      <Ionicons name="lock-closed" size={12} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            
            {filteredAchievements.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Không có danh hiệu nào thuộc nhóm này.
                </Text>
              </View>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  detailCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 26,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
      }
    }),
  },
  detailSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 180,
  },
  detailLeftCol: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRightCol: {
    width: '62%',
    paddingLeft: 12,
  },
  badgeCategory: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  detailBadgeName: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  detailBadgeDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  detailProgressContainer: {
    marginBottom: 12,
  },
  detailProgressLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 5,
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
    marginRight: 8,
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
    marginTop: 2,
  },
  statusBadgeUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextUnlocked: {
    fontSize: 11.5,
    fontWeight: '800',
    marginLeft: 4,
  },
  statusBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextLocked: {
    fontSize: 11.5,
    fontWeight: '800',
    marginLeft: 4,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  filterPillsScrollContainer: {
    maxHeight: 48,
    marginBottom: 16,
  },
  filterPillsScrollContent: {
    paddingRight: 16,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
      }
    }),
  },
  badgeThumbnailWrapper: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridItemText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  lockIconOverlay: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  }
});
