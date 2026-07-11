import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useStudyTimer(lessonId: string | undefined) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!lessonId) return;

    startTimeRef.current = Date.now();

    return () => {
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTimeRef.current) / 1000);

      // Chỉ ghi nhận nếu thời gian đọc lớn hơn 3 giây (tránh bấm nhầm) và nhỏ hơn 2 tiếng (tránh treo máy)
      if (durationSeconds > 3 && durationSeconds < 7200) {
        const localDate = new Date();
        const offset = localDate.getTimezoneOffset();
        const localToday = new Date(localDate.getTime() - (offset * 60 * 1000));
        const todayStr = localToday.toISOString().split('T')[0];

        AsyncStorage.getItem('local_study_timer_data')
          .then(data => {
            let timerData: Record<string, number> = {};
            if (data) {
              timerData = JSON.parse(data);
            }
            timerData[todayStr] = (timerData[todayStr] || 0) + durationSeconds;
            return AsyncStorage.setItem('local_study_timer_data', JSON.stringify(timerData));
          })
          .then(() => {
            console.log(`[Timer] Đã lưu thêm ${durationSeconds} giây học cho ngày ${todayStr}`);
          })
          .catch(err => {
            console.log('[Timer] Lỗi ghi nhận thời gian học:', err);
          });
      }
    };
  }, [lessonId]);
}
