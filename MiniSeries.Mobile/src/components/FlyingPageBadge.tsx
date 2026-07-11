import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/use-theme';

export interface Achievement {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  currentProgress: number;
  targetProgress: number;
}

interface FlyingPageBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  isSelected?: boolean;
}

export const FlyingPageBadge: React.FC<FlyingPageBadgeProps> = ({ achievement, isSelected = false }) => {
  const { category, name, isUnlocked, currentProgress, targetProgress } = achievement;
  const colors = useTheme();
  const isDark = colors.isDark;

  // Floating animation for unlocked pages
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isUnlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000 + Math.random() * 600, // randomized phase so they don't float in sync
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000 + Math.random() * 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    } else {
      floatAnim.setValue(0);
    }
  }, [isUnlocked]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const rotateZ = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-1deg', '1deg'],
  });

  // Render thematic paper content
  const renderPaperContent = () => {
    switch (category) {
      case 'Streak':
        return (
          <View style={styles.sheetContent}>
            {/* Checklist doodles */}
            <View style={styles.checklistLine}>
              <View style={[styles.checkbox, isUnlocked && styles.checkboxChecked]} />
              <View style={[styles.doodleLine, { width: 30 }]} />
            </View>
            <View style={styles.checklistLine}>
              <View style={[styles.checkbox, isUnlocked && styles.checkboxChecked]} />
              <View style={[styles.doodleLine, { width: 40 }]} />
            </View>
            {/* Red Hand-drawn Fire Emoji based on Tier */}
            <View style={styles.centerDoodle}>
            {achievement.key === 'streak_3' && (
                <Text style={[styles.doodleText, { fontSize: 32, opacity: isUnlocked ? 1 : 0.3 }]}>🔥</Text>
              )}
              {achievement.key === 'streak_7' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <Text style={{ fontSize: 22 }}>🔥</Text>
                  <Text style={{ fontSize: 18, color: '#fb923c', marginHorizontal: 1 }}>⚡</Text>
                  <Text style={{ fontSize: 22 }}>🔥</Text>
                </View>
              )}
              {achievement.key === 'streak_30' && (
                <View style={{ alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <Text style={{ fontSize: 16, marginBottom: 1 }}>👑</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16 }}>✨</Text>
                    <Text style={{ fontSize: 28, marginHorizontal: 2 }}>🔥</Text>
                    <Text style={{ fontSize: 16 }}>✨</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        );

      case 'Lessons':
        return (
          <View style={styles.sheetContent}>
            <View style={styles.checklistLine}>
              <View style={[styles.doodleLine, { width: 45 }]} />
            </View>
            <View style={styles.checklistLine}>
              <View style={[styles.doodleLine, { width: 35 }]} />
            </View>
            {/* Red hand-written grade badge */}
            <View style={styles.gradeBadge}>
              <Text style={[styles.gradeText, { color: isUnlocked ? '#ef4444' : '#64748b' }]}>
                {achievement.key === 'lessons_15' ? 'A++' : 'A+'}
              </Text>
            </View>
          </View>
        );

      case 'Minutes':
        return (
          <View style={styles.sheetContent}>
            {/* Math/Physics grid page doodles */}
            <View style={styles.gridLinesContainer}>
              <View style={styles.horizontalGridLine} />
              <View style={styles.horizontalGridLine} />
              <View style={styles.horizontalGridLine} />
              <View style={styles.horizontalGridLine} />
            </View>
            {/* Red Hand-drawn Time Emoji based on Tier */}
            <View style={[styles.centerDoodle, { marginTop: 4 }]}>
              {achievement.key === 'minutes_60' && (
                <View style={{ alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <Text style={{ fontSize: 32, marginBottom: 2 }}>⏳</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'monospace', color: isUnlocked ? '#3b82f6' : '#64748b' }}>60m</Text>
                </View>
              )}
              {achievement.key === 'minutes_300' && (
                <View style={{ alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <Text style={{ fontSize: 32, marginBottom: 2 }}>⏰</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'monospace', color: isUnlocked ? '#3b82f6' : '#64748b' }}>300m</Text>
                </View>
              )}
              {achievement.key === 'minutes_1200' && (
                <View style={{ alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <Text style={{ fontSize: 14, marginBottom: -2, color: isUnlocked ? '#22c55e' : '#64748b' }}>🌀</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: isUnlocked ? '#22c55e' : '#64748b' }}>✨</Text>
                    <Text style={{ fontSize: 32, marginHorizontal: 2 }}>⏳</Text>
                    <Text style={{ fontSize: 14, color: isUnlocked ? '#22c55e' : '#64748b' }}>✨</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontFamily: 'monospace', color: isUnlocked ? '#22c55e' : '#64748b', fontWeight: 'bold' }}>1200m</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'Quiz':
        return (
          <View style={styles.sheetContent}>
            {/* Trắc nghiệm circled answer sheet */}
            <View style={styles.quizLine}>
              <Text style={styles.quizNum}>1.</Text>
              <Text style={[styles.quizOption, isUnlocked && styles.quizOptionCircled]}>A</Text>
              <Text style={styles.quizOption}>B</Text>
              <Text style={styles.quizOption}>C</Text>
            </View>
            <View style={styles.quizLine}>
              <Text style={styles.quizNum}>2.</Text>
              <Text style={styles.quizOption}>A</Text>
              <Text style={styles.quizOption}>B</Text>
              <Text style={[styles.quizOption, isUnlocked && styles.quizOptionCircled]}>C</Text>
            </View>
            {/* Green handdrawn checkmark */}
            <View style={styles.checkmarkContainer}>
              <Ionicons 
                name="checkmark" 
                size={32} 
                color={isUnlocked ? '#10b981' : '#64748b'} 
                style={{ fontWeight: 'bold' }}
              />
            </View>
          </View>
        );

      case 'Level':
      case 'EXP':
      default:
        return (
          <View style={styles.sheetContent}>
            {/* Golden Star / Scroll seal */}
            <View style={styles.centerDoodle}>
              <Ionicons 
                name={achievement.key.startsWith('level') ? 'star' : 'diamond'} 
                size={38} 
                color={isUnlocked ? '#eab308' : '#64748b'} 
              />
            </View>
            <View style={[styles.checklistLine, { marginTop: 10, alignSelf: 'center' }]}>
              <View style={[styles.doodleLine, { width: 50, backgroundColor: isUnlocked ? '#eab308' : '#475569' }]} />
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Unlocked soft blue glowing backdrop */}
      {isUnlocked && (
        <View style={styles.glowBackdrop} />
      )}

      <Animated.View style={[
        {
          transform: [
            { translateY },
            { rotateZ }
          ]
        }
      ]}>
        <View style={[
          styles.outerSelectionRing,
          isSelected && {
            borderColor: colors.primaryAccent,
            borderWidth: 1.5,
            shadowColor: colors.primaryAccent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 4,
          }
        ]}>
          <View style={[
            styles.paperSheet,
            isUnlocked ? styles.paperSheetUnlocked : styles.paperSheetLocked,
          ]}>
            {/* Lined Red Margin Line on the left */}
            <View style={[styles.marginLine, isUnlocked ? styles.marginLineUnlocked : styles.marginLineLocked]} />

            {/* Thematic Content */}
            {renderPaperContent()}



            {/* Progress bar or lock overlay */}
            {!isUnlocked ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill, 
                    { width: `${Math.min(100, (currentProgress * 100) / targetProgress)}%` }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {currentProgress}/{targetProgress}
                </Text>
                {/* Lock badge in corner */}
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                </View>
              </View>
            ) : (
              <View style={styles.unlockedBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#10b981" />
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 132,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  outerSelectionRing: {
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBackdrop: {
    position: 'absolute',
    width: 112,
    height: 148,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    opacity: 0.18,
    ...Platform.select({
      web: {
        filter: 'blur(10px)',
        WebkitFilter: 'blur(10px)',
      },
      default: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      }
    })
  },
  paperSheet: {
    width: 118,
    height: 160,
    borderRadius: 6,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'space-between',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
      }
    })
  },
  paperSheetUnlocked: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  paperSheetLocked: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  marginLine: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    width: 1,
  },
  marginLineUnlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  marginLineLocked: {
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
  },
  sheetContent: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 6,
  },
  checklistLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: 2,
    marginRight: 4,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  doodleLine: {
    height: 3.5,
    backgroundColor: '#cbd5e1',
    borderRadius: 1,
  },
  centerDoodle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  doodleText: {
    textAlign: 'center',
  },
  gradeBadge: {
    position: 'absolute',
    right: 6,
    top: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ rotate: '15deg' }],
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '900',
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 10,
    right: 4,
    top: 4,
    bottom: 4,
    opacity: 0.15,
  },
  horizontalGridLine: {
    height: 1,
    backgroundColor: '#64748b',
    marginVertical: 9,
  },
  formulaText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    marginTop: 6,
  },
  formulaSubText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    marginTop: 2,
  },
  quizLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quizNum: {
    fontSize: 11.5,
    color: '#64748b',
    width: 14,
  },
  quizOption: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginHorizontal: 1,
    paddingHorizontal: 2,
  },
  quizOptionCircled: {
    color: '#3b82f6',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 4,
  },
  checkmarkContainer: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    transform: [{ rotate: '-10deg' }],
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
    paddingLeft: 8,
  },
  badgeName: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  textUnlocked: {
    color: '#1e293b',
  },
  textLocked: {
    color: '#64748b',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    paddingLeft: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 5,
    backgroundColor: '#334155',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  lockBadge: {
    position: 'absolute',
    right: 0,
    bottom: -1,
  },
  unlockedBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  }
});
