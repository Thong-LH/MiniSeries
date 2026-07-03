import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { mockQuiz } from '../data';

export const QuizSection: React.FC = () => {
  const { themeId, triggerToast } = useApp();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean | null>(null);

  const isDark = themeId === 'bold-typography-dark';

  // Brutalist Design Styles
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    correct: '#10B981',
    incorrect: '#EF4444',
    selectedBg: isDark ? '#FFFFFF' : '#000000',
    selectedText: isDark ? '#000000' : '#FAF9F6',
  };

  const handleSelect = (index: number) => {
    if (checked) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (checked) {
      // Reset quiz
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
    if (selectedAnswer === mockQuiz.correctAnswer) {
      setSuccess(true);
      triggerToast('Tuyệt vời! Đáp án hoàn toàn chính xác.');
    } else {
      setSuccess(false);
      triggerToast('Chưa chính xác! Thử lại đáp án khác nhé.');
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <Text style={[styles.header, { color: colors.text, borderBottomColor: colors.border }]}>
        📝 LUYỆN TẬP CỦNG CỐ
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.question, { color: colors.text }]}>
          {mockQuiz.question}
        </Text>

        <View style={styles.optionsContainer}>
          {mockQuiz.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === mockQuiz.correctAnswer;
            
            let optionBorderColor = colors.border;
            let optionBg = 'transparent';
            let optionTextColor = colors.text;

            if (isSelected) {
              optionBg = colors.selectedBg;
              optionTextColor = colors.selectedText;
            }

            if (checked) {
              if (isCorrectAnswer) {
                optionBorderColor = colors.correct;
                if (isSelected) {
                  optionBg = colors.correct;
                  optionTextColor = '#FFFFFF';
                }
              } else if (isSelected) {
                optionBorderColor = colors.incorrect;
                optionBg = colors.incorrect;
                optionTextColor = '#FFFFFF';
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
                    <Text style={[styles.optionIndicatorText, { color: optionBg }]}>✓</Text>
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
              backgroundColor: success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
            }
          ]}>
            <Text style={[
              styles.explanationTitle,
              { color: success ? colors.correct : colors.incorrect }
            ]}>
              {success ? '✓ ĐÁP ÁN CHÍNH XÁC' : '✗ CHƯA CHÍNH XÁC'}
            </Text>
            <Text style={[styles.explanationText, { color: colors.text }]}>
              {mockQuiz.explanation}
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
            borderColor: colors.border,
            shadowColor: colors.border,
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
    borderWidth: 2,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    fontFamily: 'System',
    fontWeight: '900',
    fontSize: 14,
    padding: 12,
    borderBottomWidth: 2,
    letterSpacing: 1,
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
    borderWidth: 2,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 20,
    height: 20,
    borderWidth: 2,
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
    borderWidth: 2,
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
    borderWidth: 2,
    margin: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
