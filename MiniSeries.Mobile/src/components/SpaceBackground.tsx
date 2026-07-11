import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, Platform } from 'react-native';
import { useTheme } from '../hooks/use-theme';

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

  if (plain) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bg }]}>
        <View style={styles.nebulaOrange} />
        <View style={styles.nebulaBlue} />
        <View style={styles.nebulaPurple} />
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bg }]}>
      {/* Background Nebulas */}
      <View style={styles.nebulaOrange} />
      <View style={styles.nebulaBlue} />
      <View style={styles.nebulaPurple} />

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
  nebulaOrange: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(251, 146, 60, 0.05)',
  },
  nebulaBlue: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  nebulaPurple: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
  },
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
