import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { DesignThemeId, DesignTheme, Lesson } from '../types';
import { designThemes } from '../data';
import { apiClient, initializeAuthToken, setUnauthorizedCallback } from '../services/apiClient';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppContextType {
  themeId: DesignThemeId;
  setThemeId: (id: DesignThemeId) => void;
  activeTheme: DesignTheme;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  mangaTokens: number;
  setMangaTokens: React.Dispatch<React.SetStateAction<number>>;
  videoTokens: number;
  setVideoTokens: React.Dispatch<React.SetStateAction<number>>;
  activePlan: string;
  setActivePlan: (plan: string) => void;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  userEmail: string;
  setUserEmail: (email: string) => void;
  refreshProfile: () => Promise<void>;
  shouldRefreshHome: boolean;
  setShouldRefreshHome: (refresh: boolean) => void;
  
  lessonTitle: string;
  setLessonTitle: (title: string) => void;
  lessonContent: string;
  setLessonContent: (content: string) => void;
  selectedFormat: 'manga' | 'video';
  setSelectedFormat: (format: 'manga' | 'video') => void;
  isGenerating: boolean;
  setIsGenerating: (gen: boolean) => void;
  generationStep: string;
  setGenerationStep: (step: string) => void;
  
  // Viewer state
  viewingLesson: Lesson | null;
  setViewingLesson: (lesson: Lesson | null) => void;
  viewerPage: number;
  setViewerPage: (page: number) => void;
  
  
  // Toast notifications
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
  closeToast: () => void;
  
  // Weekly Target
  weeklyTarget: number;
  setWeeklyTarget: (target: number) => void;

  // EXP / Level state
  globalLevel: number;
  globalExp: number;
  globalNextLevelExp: number;
  globalPrevLevelExp: number;
  globalLevelLabel: string;
  expNotification: number | null;
  refreshStats: () => Promise<void>;
  updateStatsFromData: (data: any) => void;
  awardExpMock: (amount: number) => void;
  globalStreak: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<DesignThemeId>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return (localStorage.getItem('themeId') as DesignThemeId) || 'bold-typography-dark';
    }
    return 'bold-typography-dark';
  });

  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return localStorage.getItem('isAuthenticated') === 'true';
    }
    return false;
  });

  const [mangaTokens, setMangaTokens] = useState<number>(29);
  const [videoTokens, setVideoTokens] = useState<number>(10);
  const [activePlan, setActivePlan] = useState<string>('Basic');
  
  // Initialize lessons to empty array instead of initialLessons to avoid displaying mock lessons before API finishes
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [userEmail, setUserEmailState] = useState<string>('thonglhse182025@fpt.edu.vn');
  
  // Create forms state
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonContent, setLessonContent] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'manga' | 'video'>('video');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  
  // Viewer state
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shouldRefreshHome, setShouldRefreshHome] = useState<boolean>(false);
  const activeTheme = designThemes.find(t => t.id === themeId) || designThemes[0];

  // Khôi phục phiên đăng nhập trên thiết bị di động khi app được mount
  useEffect(() => {
    setUnauthorizedCallback(() => {
      setIsAuthenticated(false);
      setUserEmailState('');
    });

    const restoreSession = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          return;
        }
        const token = await initializeAuthToken();
        const savedEmail = await AsyncStorage.getItem('userEmail');
        const savedIsAuth = await AsyncStorage.getItem('isAuthenticated');
        if (token && savedIsAuth === 'true') {
          if (savedEmail) {
            setUserEmailState(savedEmail);
          }
          setIsAuthenticatedState(true);
        }
      } catch (e) {
        console.log('Lỗi phục hồi token xác thực:', e);
      }
    };
    restoreSession();
  }, []);

  const setIsAuthenticated = (auth: boolean) => {
    setIsAuthenticatedState(auth);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', String(auth));
    } else {
      if (auth) {
        AsyncStorage.setItem('isAuthenticated', 'true').catch(() => {});
      } else {
        AsyncStorage.removeItem('isAuthenticated').catch(() => {});
        AsyncStorage.removeItem('authToken').catch(() => {});
      }
    }
  };

  const setUserEmail = (email: string) => {
    setUserEmailState(email);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('userEmail', email);
    } else {
      AsyncStorage.setItem('userEmail', email).catch(() => {});
    }
  };

  const changeThemeId = (id: DesignThemeId) => {
    setThemeId(id);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('themeId', id);
    }
  };

  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3500);
  };

  const closeToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(null);
  };

  const refreshProfile = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/profile/me');
      if (res.data) {
        if (res.data.planName) setActivePlan(res.data.planName);
        if (res.data.remainingMangaCount !== undefined) setMangaTokens(res.data.remainingMangaCount);
        if (res.data.remainingVideoCount !== undefined) setVideoTokens(res.data.remainingVideoCount);
        if (res.data.email) setUserEmail(res.data.email);
      }
    } catch (err) {
      console.log('Lỗi cập nhật profile từ server:', err);
    }
  };

  // Weekly Target state
  const [weeklyTarget, setWeeklyTargetState] = useState<number>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return Number(localStorage.getItem('weeklyTarget')) || 4;
    }
    return 4;
  });

  const setWeeklyTarget = (target: number) => {
    setWeeklyTargetState(target);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('weeklyTarget', String(target));
    }
  };

  // EXP / Level state
  const [globalLevel, setGlobalLevel] = useState<number>(1);
  const [globalExp, setGlobalExp] = useState<number>(0);
  const [globalNextLevelExp, setGlobalNextLevelExp] = useState<number>(100);
  const [globalPrevLevelExp, setGlobalPrevLevelExp] = useState<number>(0);
  const [globalLevelLabel, setGlobalLevelLabel] = useState<string>('Tập sự');
  const [expNotification, setExpNotification] = useState<number | null>(null);
  const [globalStreak, setGlobalStreak] = useState<number>(0);

  const updateStatsFromData = (data: any) => {
    const oldExp = globalExp;
    const newExp = data.totalExp ?? 0;
    
    setGlobalLevel(data.currentLevel ?? 1);
    setGlobalExp(newExp);
    setGlobalNextLevelExp(data.nextLevelExp ?? 100);
    setGlobalPrevLevelExp(data.prevLevelExp ?? 0);
    setGlobalLevelLabel(data.levelLabel ?? 'Tập sự');
    if (data.currentStreak !== undefined) {
      setGlobalStreak(data.currentStreak);
    }
    
    if (oldExp > 0 && newExp > oldExp) {
      setExpNotification(newExp - oldExp);
      setTimeout(() => {
        setExpNotification(null);
      }, 2600);
    }
  };

  const refreshStats = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/progress/dashboard');
      if (res.data) {
        updateStatsFromData(res.data);
      }
    } catch (e) {
      console.log('Error refreshing stats:', e);
    }
  };

  const awardExpMock = (amount: number) => {
    setExpNotification(amount);
    setGlobalExp((prev) => prev + amount);
    setTimeout(() => {
      setExpNotification(null);
    }, 2600);
  };

  return (
    <AppContext.Provider
      value={{
        themeId,
        setThemeId: changeThemeId,
        activeTheme,
        isAuthenticated,
        setIsAuthenticated,
        mangaTokens,
        setMangaTokens,
        videoTokens,
        setVideoTokens,
        activePlan,
        setActivePlan,
        lessons,
        setLessons,
        lessonTitle,
        setLessonTitle,
        lessonContent,
        setLessonContent,
        selectedFormat,
        setSelectedFormat,
        isGenerating,
        setIsGenerating,
        generationStep,
        setGenerationStep,
        viewingLesson,
        setViewingLesson,
        viewerPage,
        setViewerPage,
        toastMessage,
        triggerToast,
        closeToast,
        userEmail,
        setUserEmail,
        refreshProfile,
        shouldRefreshHome,
        setShouldRefreshHome,
        weeklyTarget,
        setWeeklyTarget,
        globalLevel,
        globalExp,
        globalNextLevelExp,
        globalPrevLevelExp,
        globalLevelLabel,
        expNotification,
        refreshStats,
        updateStatsFromData,
        awardExpMock,
        globalStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
