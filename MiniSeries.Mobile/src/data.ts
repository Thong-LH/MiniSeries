/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DesignTheme, Lesson, Scene, QuizQuestion } from './types';

export const designThemes: DesignTheme[] = [
  {
    id: 'bold-typography',
    name: 'Bold Typography (Brutalist Redesign)',
    description: 'Phong cách Brutalism táo bạo, đậm chất Thụy Sĩ. Font chữ cực lớn, viền dày đen 2px cá tính và hiệu ứng đổ bóng cứng (hard solid shadow).',
    styles: {
      background: 'bg-[#FAF9F6]',
      surface: 'bg-[#FAF9F6]',
      surfaceContainer: 'bg-[#FAF9F6]',
      surfaceContainerLowest: 'bg-[#ffffff]',
      border: 'border-black border-2',
      textPrimary: 'text-[#1A1A1A]',
      textMuted: 'text-[#4A4A4A]',
      primaryAccent: 'text-[#1A1A1A] bg-[#FF3E00]/10',
      primaryAccentHover: 'hover:bg-[#FF3E00] hover:text-[#FAF9F6]',
      primaryText: 'text-[#FF3E00]',
      secondaryAccent: 'text-[#1A1A1A]',
      secondaryText: 'text-[#1A1A1A]',
      glassEffect: 'bg-[#FAF9F6] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      borderRadius: 'rounded-none',
      fontFamilyDisplay: 'font-display',
      fontFamilyBody: 'font-sans',
      buttonPrimaryBg: 'bg-black text-[#FAF9F6] border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,62,0,1)] hover:bg-[#FF3E00] hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200',
      buttonPrimaryText: 'text-[#FAF9F6] font-extrabold uppercase tracking-widest',
      buttonSecondaryBg: 'bg-transparent border-2 border-black text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#FAF9F6] transition-all duration-200',
      buttonSecondaryText: 'text-[#1A1A1A] font-extrabold uppercase tracking-wider',
      inputBg: 'bg-white',
      inputBorder: 'border-2 border-black focus:ring-0 focus:border-[#FF3E00]',
      badgeBg: 'bg-black text-[#FAF9F6] border border-black',
      badgeText: 'text-[#FAF9F6] font-mono font-bold',
      glow: 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
      cardBorder: 'border-black border-2'
    }
  },
  {
    id: 'bold-typography-dark',
    name: 'Bold Brutal Dark (Noir Brutalist)',
    description: 'Phong cách Brutalism táo bạo phiên bản tối. Viền dày trắng, bóng cứng rực rỡ và độ tương phản cực kỳ cao, tối ưu cho thiết bị di động.',
    styles: {
      background: 'bg-[#121212]',
      surface: 'bg-[#121212]',
      surfaceContainer: 'bg-[#1e1e1e]',
      surfaceContainerLowest: 'bg-[#0a0a0a]',
      border: 'border-white border-2',
      textPrimary: 'text-[#FAF9F6]',
      textMuted: 'text-[#CFCFCF]',
      primaryAccent: 'text-[#FAF9F6] bg-[#FF3E00]/20',
      primaryAccentHover: 'hover:bg-[#FF3E00] hover:text-[#121212]',
      primaryText: 'text-[#FF3E00]',
      secondaryAccent: 'text-[#FAF9F6]',
      secondaryText: 'text-[#FAF9F6]',
      glassEffect: 'bg-[#121212] border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]',
      borderRadius: 'rounded-none',
      fontFamilyDisplay: 'font-display',
      fontFamilyBody: 'font-sans',
      buttonPrimaryBg: 'bg-white text-black border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,62,0,1)] hover:bg-[#FF3E00] hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-200',
      buttonPrimaryText: 'text-black font-extrabold uppercase tracking-widest',
      buttonSecondaryBg: 'bg-transparent border-2 border-white text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-white hover:text-black transition-all duration-200',
      buttonSecondaryText: 'text-white font-extrabold uppercase tracking-wider',
      inputBg: 'bg-[#1e1e1e]',
      inputBorder: 'border-2 border-white focus:ring-0 focus:border-[#FF3E00]',
      badgeBg: 'bg-white text-black border border-white',
      badgeText: 'text-black font-mono font-bold',
      glow: 'shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]',
      cardBorder: 'border-white border-2'
    }
  }
];

export const initialLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Introduction to Manga Pacing & Flow',
    type: 'manga',
    duration: '45 min',
    status: 'Hoàn thành',
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    description: 'Học cách thiết kế khung hình manga để tạo nhịp điệu đọc lôi cuốn và tự nhiên.'
  },
  {
    id: 'lesson-2',
    title: 'Advanced Transitions Workshop',
    type: 'video',
    duration: '1h 20m',
    status: 'Đang học',
    progress: 40,
    coverUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    description: 'Các kỹ thuật chuyển cảnh điện ảnh nâng cao áp dụng cho video ngắn và phim.'
  },
  {
    id: 'lesson-3',
    title: 'Rendering Project Alpha',
    type: 'video',
    duration: '1h 5m',
    status: 'Đang tạo',
    progress: 75,
    coverUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&auto=format&fit=crop&q=80',
    description: 'Quy trình hậu kỳ và kết xuất sản phẩm đồ họa 3D chất lượng cao.'
  }
];

export const mockScenes: Scene[] = [
  {
    number: 1,
    title: 'Introduction',
    duration: '00:00 - 00:15',
    visual: 'A wide shot of a bustling modern cityscape at twilight, neon lights beginning to flicker to life. The camera slowly pushes in towards a sleek, glass-fronted office building.',
    narrator: 'The city never sleeps, but true innovation happens in the quiet moments between the noise. It’s here that ideas take root.',
    action: 'Cut to interior. A lone figure stands by the window, looking out over the city. They turn towards the camera with a look of determination.'
  },
  {
    number: 2,
    title: 'The Challenge',
    duration: '00:15 - 00:45',
    visual: 'Fast-paced montage of complex data graphs, overflowing inboxes, and hurried meetings. The color palette is cool and tense.',
    narrator: 'Every day presents a new puzzle. The sheer volume of information can overwhelm even the most prepared minds.',
    action: 'Focus on a close-up of hands typing furiously on a glowing keyboard. The screen reflects in their eyes.'
  },
  {
    number: 3,
    title: 'The Solution',
    duration: '00:45 - 01:15',
    visual: 'The lighting shifts to warm and clear. The character opens a sleek AI-powered app that instantly simplifies the dashboard.',
    narrator: 'But with the right tools, complexity becomes clarity. You don’t just manage the flow; you direct it.',
    action: 'The character smiles, turns around, and walks out confidently as the background dims gracefully.'
  }
];

export const mockQuiz: QuizQuestion = {
  question: 'Cơ chế định tuyến gói tin (Packet Routing) dựa trên yếu tố nào để truyền dữ liệu đi tối ưu nhất?',
  options: [
    'Địa chỉ IP nguồn và đích nằm trong gói tin',
    'Địa chỉ MAC vật lý của các thiết bị chuyển mạch',
    'Tên miền DNS của máy chủ đích',
    'Độ dày của cáp quang truyền dẫn vật lý'
  ],
  correctAnswer: 0
};

export const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    billing: '/ mo',
    description: 'Khám phá các tính năng cơ bản của MiniSeries.',
    features: [
      '5 Manga bài học / tháng',
      '1 Video ngắn kịch bản / tháng',
      'Độ phân giải kịch bản SD',
      'Hỗ trợ AI cơ bản'
    ],
    cta: 'Dùng Gói Free',
    isCurrent: true
  },
  {
    name: 'Basic',
    price: '$10',
    billing: '/ mo',
    description: 'Hoàn hảo cho học sinh và người mới bắt đầu.',
    features: [
      '30 Manga bài học / tháng',
      '10 Video ngắn kịch bản / tháng',
      'Độ phân giải kịch bản Full HD',
      'Công nghệ AI thế hệ mới',
      'Hỗ trợ xuất file PDF / MP4 nháp'
    ],
    cta: 'Nâng cấp ngay',
    isCurrent: false
  },
  {
    name: 'Premium',
    price: '$50',
    billing: '/ mo',
    description: 'Sáng tạo không giới hạn cho giảng viên chuyên nghiệp.',
    features: [
      'Không giới hạn sáng tạo Manga',
      '50 Video ngắn kịch bản chất lượng cao / tháng',
      'Độ phân giải kịch bản Ultra HD 4K',
      'AI tối ưu hóa giọng đọc & hình ảnh độc quyền',
      'Hỗ trợ VIP 24/7'
    ],
    cta: 'Nâng cấp Premium',
    isCurrent: false,
    badge: 'Đáng Giá Nhất'
  }
];
