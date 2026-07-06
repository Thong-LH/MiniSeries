import React, { createContext, useState, useContext, useEffect } from 'react';
import { DesignThemeId, DesignTheme, Lesson } from '../types';
import { designThemes, initialLessons } from '../data';

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
  const [themeId, setThemeId] = useState<DesignThemeId>('bold-typography-dark');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mangaTokens, setMangaTokens] = useState<number>(29);
  const [videoTokens, setVideoTokens] = useState<number>(10);
  const [activePlan, setActivePlan] = useState<string>('Basic');
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  
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

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        themeId,
        setThemeId,
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
