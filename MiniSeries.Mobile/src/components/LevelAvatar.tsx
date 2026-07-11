import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';

// Platform-safe SVG Components
let SvgComponent: any = 'svg';
let CircleComponent: any = 'circle';

if (Platform.OS !== 'web') {
  try {
    const RNSvg = require('react-native-svg');
    SvgComponent = RNSvg.default || RNSvg.Svg || RNSvg;
    CircleComponent = RNSvg.Circle;
  } catch (e) {
    console.log('Failed to load react-native-svg on native', e);
  }
}

export const LevelAvatar: React.FC = () => {
  const { 
    globalLevel, 
    globalExp, 
    globalNextLevelExp, 
    globalPrevLevelExp, 
    expNotification,
    awardExpMock
  } = useApp();
  const colors = useTheme();
  const isDark = colors.isDark;

  // Local state to hold the text displayed in the center
  const [displayedText, setDisplayedText] = useState<string>(String(globalLevel));

  // Animation values for center text transition
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textScale = useRef(new Animated.Value(1)).current;

  // Track the previous notification state
  const prevNotifRef = useRef<number | null>(null);

  // Synchronize displayedText with globalLevel when not in animation state
  useEffect(() => {
    if (expNotification === null && displayedText !== String(globalLevel)) {
      setDisplayedText(String(globalLevel));
    }
  }, [globalLevel, expNotification, displayedText]);

  useEffect(() => {
    if (expNotification !== null && expNotification !== prevNotifRef.current) {
      // 1. Fade out current level number quickly
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(textScale, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: Platform.OS !== 'web',
        })
      ]).start(() => {
        // 2. Switch text to +EXP while hidden
        setDisplayedText(`+${expNotification}`);

        // 3. Fade in the +EXP text
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(textScale, {
            toValue: 1.1,
            friction: 5,
            useNativeDriver: Platform.OS !== 'web',
          })
        ]).start(() => {
          // 4. Keep showing +EXP while circular bar animates, then fade out
          Animated.delay(1200).start(() => {
            Animated.parallel([
              Animated.timing(textOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(textScale, {
                toValue: 0.7,
                duration: 150,
                useNativeDriver: Platform.OS !== 'web',
              })
            ]).start(() => {
              // 5. Reset back to the Level number while hidden
              setDisplayedText(String(globalLevel));

              // 6. Fade in the Level number
              Animated.parallel([
                Animated.timing(textOpacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.spring(textScale, {
                  toValue: 1,
                  friction: 6,
                  useNativeDriver: Platform.OS !== 'web',
                })
              ]).start();
            });
          });
        });
      });
    }
    prevNotifRef.current = expNotification;
  }, [expNotification, globalLevel]);

  // Compute EXP percentage for circular progress
  const progress = globalExp - globalPrevLevelExp;
  const range = Math.max(1, globalNextLevelExp - globalPrevLevelExp);
  const percentage = Math.min(100, Math.max(0, (progress * 100) / range));

  // Circle properties
  const size = 44;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <SvgComponent pointerEvents="none" width={size} height={size} style={styles.svg}>
          {/* Background Track Circle */}
          <CircleComponent
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active EXP Progress Circle */}
          <CircleComponent
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primaryAccent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            {...(Platform.OS === 'web' ? {
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transform: `rotate(-90 ${size / 2} ${size / 2})`
            } : {
              strokeDasharray: [circumference],
              strokeDashoffset: strokeDashoffset,
              origin: `${size / 2}, ${size / 2}`,
              rotation: -90
            })}
          />
        </SvgComponent>

        {/* Inner Container: Replaces Monogram with Level or +EXP */}
        <View style={[
          styles.innerContainer, 
          { 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
          }
        ]}>
          <Animated.View style={{
            opacity: textOpacity,
            transform: [{ scale: textScale }],
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={displayedText.startsWith('+') ? styles.expText : [styles.levelText, { color: colors.text }]}>
              {displayedText}
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    zIndex: 2,
  },
  innerContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'monospace',
    textAlign: 'center',
  },
  expText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#22c55e',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'monospace',
  }
});
