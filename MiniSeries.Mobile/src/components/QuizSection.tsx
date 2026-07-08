import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { mockQuiz } from '../data';
import { useTheme } from '../hooks/use-theme';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizSectionProps {
  quiz?: QuizQuestion;
  onComplete?: () => void;
}

export const QuizSection: React.FC<QuizSectionProps> = ({ quiz, onComplete }) => {
  const { themeId, triggerToast } = useApp();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean | null>(null);

  const theme = useTheme();
  const isDark = theme.isDark;

  // Brutalist Design Styles
  const colors = {
    bg: theme.background,
    text: theme.text,
    textMuted: theme.textMuted,
    border: theme.border,
    primaryAccent: theme.primaryAccent,
    correct: theme.correct,
    incorrect: theme.incorrect,
    selectedBg: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(99, 102, 241, 0.1)',
    selectedText: theme.primaryAccent,
  };

  const activeQuiz = quiz || mockQuiz;

  const handleSelect = (index: number) => {
    if (checked) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (checked) {
      setSelectedAnswer(null);
      setChecked(false);
      setSuccess(null);
      return;
    }

    if (selectedAnswer === null) {
      triggerToast('Vui lòng chọn một đáp án!');
      return;
    }

    setChecked(true);
    if (selectedAnswer === activeQuiz.correctAnswer) {
      setSuccess(true);
      triggerToast('Tuyệt vời! Đáp án hoàn toàn chính xác.');
      if (onComplete) {
        onComplete();
      }
    } else {
      setSuccess(false);
      triggerToast('Chưa chính xác! Thử lại đáp án khác nhé.');
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <Text style={[styles.header, { color: colors.text, borderBottomColor: colors.border }]}>
        📝 LUYỆN TẬP CỦNG CỐ
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.question, { color: colors.text }]}>
          {activeQuiz.question}
        </Text>

        <View style={styles.optionsContainer}>
          {activeQuiz.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === activeQuiz.correctAnswer;
            
            let optionBorderColor = colors.border;
            let optionBg = 'transparent';
            let optionTextColor = colors.text;

            if (isSelected) {
              optionBg = colors.selectedBg;
              optionTextColor = colors.selectedText;
              optionBorderColor = colors.primaryAccent;
            }

            if (checked) {
              if (isCorrectAnswer) {
                optionBorderColor = colors.correct;
                if (isSelected) {
                  optionBg = 'rgba(16, 185, 129, 0.15)';
                  optionTextColor = colors.correct;
                }
              } else if (isSelected) {
                optionBorderColor = colors.incorrect;
                optionBg = 'rgba(239, 68, 68, 0.15)';
                optionTextColor = colors.incorrect;
              }
            }

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => handleSelect(index)}
                style={[
                  styles.optionButton,
                  {
                    borderColor: optionBorderColor,
                    backgroundColor: optionBg,
                  }
                ]}
              >
                <View style={[
                  styles.optionIndicator,
                  {
                    borderColor: isSelected ? optionTextColor : colors.border,
                    backgroundColor: isSelected ? optionTextColor : 'transparent'
                  }
                ]}>
                  {isSelected && (
                    <Text style={[styles.optionIndicatorText, { color: optionBg === 'transparent' ? '#ffffff' : optionBg }]}>✓</Text>
                  )}
                </View>
                <Text style={[styles.optionText, { color: optionTextColor }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {checked && (
          <View style={[
            styles.explanationBox,
            {
              borderColor: colors.border,
              backgroundColor: success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'
            }
          ]}>
            <Text style={[
              styles.explanationTitle,
              { color: success ? colors.correct : colors.incorrect }
            ]}>
              {success ? 'ĐÁP ÁN CHÍNH XÁC' : 'CHƯA CHÍNH XÁC'}
            </Text>
            <Text style={[styles.explanationText, { color: colors.text }]}>
              {activeQuiz.explanation}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSubmit}
        style={[
          styles.submitButton,
          {
            backgroundColor: checked ? 'transparent' : colors.primaryAccent,
            borderColor: checked ? colors.border : colors.primaryAccent,
          }
        ]}
      >
        <Text style={[
          styles.submitButtonText,
          { color: checked ? colors.text : '#FFFFFF' }
        ]}>
          {checked ? 'LÀM LẠI TRẮC NGHIỆM' : 'KIỂM TRA ĐÁP ÁN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    fontFamily: 'System',
    fontWeight: '800',
    fontSize: 13,
    padding: 12,
    borderBottomWidth: 1,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndicatorText: {
    fontSize: 10,
    fontWeight: '900',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  explanationBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  explanationTitle: {
    fontWeight: '900',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  explanationText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: 10,
    margin: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
