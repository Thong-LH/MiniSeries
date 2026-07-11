import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/use-theme';
import { apiClient } from '../services/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const { triggerToast } = useApp();
  const theme = useTheme();
  const isDark = theme.isDark;

  const colors = {
    bg: isDark ? 'rgba(3, 7, 18, 0.95)' : 'rgba(248, 250, 252, 0.95)',
    cardBg: theme.cardBg,
    text: theme.text,
    textMuted: theme.textMuted,
    border: theme.border,
    primaryAccent: theme.primaryAccent,
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      triggerToast('Vui lòng chọn số sao đánh giá.');
      return;
    }
    if (!comment.trim()) {
      triggerToast('Vui lòng nhập nội dung đánh giá.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/feedback/create', {
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (e) {
      console.log('Failed to submit feedback:', e);
      triggerToast('Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setSubmitted(false);
    onClose();
  };

  const starColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerText, { color: colors.text }]}>GỬI ĐÁNH GIÁ</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.centerContainer}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
              <Text style={[styles.successTitle, { color: colors.text }]}>
                Cảm ơn bạn đã đánh giá!
              </Text>
              <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
                Phản hồi của bạn giúp chúng tôi cải thiện sản phẩm tốt hơn.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClose}
                style={[styles.doneBtn, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={styles.doneBtnText}>ĐÓNG</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              {/* Star Rating */}
              <Text style={[styles.label, { color: colors.textMuted }]}>MỨC ĐỘ HÀI LÒNG</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? starColors[rating - 1] : colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={[styles.ratingLabel, { color: starColors[rating - 1] }]}>
                  {['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'][rating - 1]}
                </Text>
              )}

              {/* Comment */}
              <Text style={[styles.label, { color: colors.textMuted, marginTop: 20 }]}>NỘI DUNG ĐÁNH GIÁ</Text>
              <TextInput
                style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                placeholder="Chia sẻ trải nghiệm của bạn với MiniSeries..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              <Text style={[styles.charCount, { color: colors.textMuted }]}>
                {comment.length}/500
              </Text>

              {/* Submit */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSubmit}
                disabled={submitting}
                style={[styles.submitBtn, { backgroundColor: colors.primaryAccent, opacity: submitting ? 0.6 : 1 }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>GỬI ĐÁNH GIÁ</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  doneBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontWeight: '600',
    minHeight: 120,
  },
  charCount: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
