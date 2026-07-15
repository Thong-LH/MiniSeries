import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, Platform } from 'react-native';
import { useTheme } from '../hooks/use-theme';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface SpaceBackgroundProps {
  plain?: boolean;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ plain = false }) => {
  const colors = useTheme();

  // Twinkling stars
  const starCount = 25;
  const opacityValues = useRef(Array.from({ length: starCount }, () => new Animated.Value(Math.random()))).current;

  // Floating sparks (magic star dust)
  const sparkCount = 12;
  const sparkTranslateY = useRef(Array.from({ length: sparkCount }, () => new Animated.Value(height))).current;
  const sparkTranslateX = useRef(Array.from({ length: sparkCount }, () => new Animated.Value(0))).current;
  const sparkOpacity = useRef(Array.from({ length: sparkCount }, () => new Animated.Value(0))).current;

  useEffect(() => {
    // Twinkle animation for stars
    opacityValues.forEach((val) => {
      const animateTwinkle = () => {
        Animated.sequence([
          Animated.timing(val, {
            toValue: 0.15 + Math.random() * 0.25,
            duration: 1500 + Math.random() * 2500,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.75 + Math.random() * 0.25,
            duration: 1500 + Math.random() * 2500,
            useNativeDriver: true,
          }),
        ]).start(() => animateTwinkle());
      };
      animateTwinkle();
    });

    // Drifting animation for sparks
    sparkTranslateY.forEach((val, i) => {
      const duration = 10000 + Math.random() * 8000;
      const delay = Math.random() * 8000;

      const animateSpark = () => {
        val.setValue(height + 20);
        sparkTranslateX[i].setValue(Math.random() * width);
        sparkOpacity[i].setValue(0.1 + Math.random() * 0.3);

        Animated.parallel([
          Animated.timing(val, {
            toValue: -20,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(sparkTranslateX[i], {
            toValue: Math.random() * width,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(sparkOpacity[i], {
              toValue: 0.6 + Math.random() * 0.3,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(sparkOpacity[i], {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          setTimeout(animateSpark, Math.random() * 1000);
        });
      };

      setTimeout(animateSpark, delay);
    });
  }, []);

  // Generate fixed positions for stars on initial load
  const starPositions = useRef(
    Array.from({ length: starCount }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: 1.5 + Math.random() * 2,
    }))
  ).current;

  // Generate positions and colors for sparks
  const sparkColors = useRef(
    Array.from({ length: sparkCount }, () => {
      const rand = Math.random();
      if (rand < 0.45) return '#fb923c'; // orange
      if (rand < 0.9) return '#38bdf8'; // blue
      return '#fde047'; // yellow gold
    })
  ).current;

  const isDark = colors.isDark;

  const renderSvgNebulas = () => (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="orangeGlow" cx="0%" cy="100%" rx="60%" ry="60%" fx="0%" fy="100%">
          <Stop offset="0%" stopColor="#fb923c" stopOpacity={isDark ? 0.20 : 0.10} />
          <Stop offset="50%" stopColor="#fb923c" stopOpacity={isDark ? 0.08 : 0.04} />
          <Stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="blueGlow" cx="100%" cy="0%" rx="65%" ry="65%" fx="100%" fy="0%">
          <Stop offset="0%" stopColor="#38bdf8" stopOpacity={isDark ? 0.22 : 0.10} />
          <Stop offset="50%" stopColor="#38bdf8" stopOpacity={isDark ? 0.08 : 0.04} />
          <Stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="purpleGlow" cx="30%" cy="35%" rx="50%" ry="50%" fx="30%" fy="35%">
          <Stop offset="0%" stopColor="#a855f7" stopOpacity={isDark ? 0.14 : 0.07} />
          <Stop offset="60%" stopColor="#a855f7" stopOpacity={isDark ? 0.04 : 0.02} />
          <Stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#orangeGlow)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#blueGlow)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#purpleGlow)" />
    </Svg>
  );

  if (plain) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bg }]}>
        {renderSvgNebulas()}
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bg }]}>
      {/* Background Nebulas */}
      {renderSvgNebulas()}

      {/* Orbit Lines connecting portals */}
      <View style={styles.orbit1} />
      <View style={styles.orbit2} />

      {/* Static Twinkling Stars */}
      {starPositions.map((pos, index) => (
        <Animated.View
          key={`star-${index}`}
          style={[
            styles.star,
            {
              top: pos.top as any,
              left: pos.left as any,
              width: pos.size,
              height: pos.size,
              borderRadius: pos.size / 2,
              opacity: opacityValues[index],
            },
          ]}
        />
      ))}

      {/* Floating Sparkles (Space Dust) */}
      {sparkTranslateY.map((yVal, index) => (
        <Animated.View
          key={`spark-${index}`}
          style={[
            styles.spark,
            {
              backgroundColor: sparkColors[index],
              shadowColor: sparkColors[index],
              transform: [
                { translateY: yVal },
                { translateX: sparkTranslateX[index] },
              ],
              opacity: sparkOpacity[index],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({

  orbit1: {
    position: 'absolute',
    top: '10%',
    left: '-60%',
    width: width * 2.2,
    height: height * 0.6,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.08)',
    borderRadius: width,
    borderStyle: 'dashed',
    transform: [{ rotate: '-28deg' }],
  },
  orbit2: {
    position: 'absolute',
    top: '30%',
    left: '-60%',
    width: width * 2.2,
    height: height * 0.55,
    borderWidth: 0.8,
    borderColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: width,
    borderStyle: 'dashed',
    transform: [{ rotate: '12deg' }],
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  spark: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 1,
  },
});
