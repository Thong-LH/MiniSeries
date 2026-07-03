/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DesignThemeId = 'bold-typography' | 'bold-typography-dark';

export interface DesignTheme {
  id: DesignThemeId;
  name: string;
  description: string;
  styles: {
    background: string;
    surface: string;
    surfaceContainer: string;
    surfaceContainerLowest: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primaryAccent: string;
    primaryAccentHover: string;
    primaryText: string;
    secondaryAccent: string;
    secondaryText: string;
    glassEffect: string;
    borderRadius: string;
    fontFamilyDisplay: string;
    fontFamilyBody: string;
    buttonPrimaryBg: string;
    buttonPrimaryText: string;
    buttonSecondaryBg: string;
    buttonSecondaryText: string;
    inputBg: string;
    inputBorder: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
    cardBorder: string;
  };
}

export type ScreenId = 'home' | 'create' | 'review' | 'viewer' | 'profile';

export interface Lesson {
  id: string;
  title: string;
  type: 'manga' | 'video';
  duration: string;
  status: 'Hoàn thành' | 'Đang học' | 'Đang tạo';
  progress?: number;
  coverUrl: string;
  description?: string;
}

export interface Scene {
  number: number;
  title: string;
  duration: string;
  visual: string;
  narrator: string;
  action: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}
