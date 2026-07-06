import React, { createContext, useState, useContext, useEffect } from 'react';
import { DesignThemeId, DesignTheme, Lesson } from '../types';
import { designThemes } from '../data';
import { apiClient } from '../services/apiClient';
import { Platform } from 'react-native';

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
  
  // Create forms state
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

  const [userEmail, setUserEmailState] = useState<string>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return localStorage.getItem('userEmail') || 'thonglhse182025@fpt.edu.vn';
    }
    return 'thonglhse182025@fpt.edu.vn';
  });
  
  // Create forms state
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonContent, setLessonContent] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'manga' | 'video'>('video');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  
  // Viewer state
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeTheme = designThemes.find(t => t.id === themeId) || designThemes[0];

  const setIsAuthenticated = (auth: boolean) => {
    setIsAuthenticatedState(auth);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', String(auth));
    }
  };

  const setUserEmail = (email: string) => {
    setUserEmailState(email);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('userEmail', email);
    }
  };

  const changeThemeId = (id: DesignThemeId) => {
    setThemeId(id);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('themeId', id);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshProfile = async () => {
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
        userEmail,
        setUserEmail,
        refreshProfile,
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
