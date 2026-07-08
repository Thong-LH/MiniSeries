/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DesignTheme, Lesson, Scene, QuizQuestion } from './types';

export const designThemes: DesignTheme[] = [
  {
    id: 'bold-typography',
    name: 'Cyber Glassmorphism (Light)',
    description: 'Giao diện sáng tinh tế với phong cách kính mờ (glassmorphism), các góc bo tròn thanh lịch và bóng đổ nhẹ nhàng.',
    styles: {
      background: 'bg-[#FAF9F6]',
      surface: 'bg-[#ffffff]',
      surfaceContainer: 'bg-[#f1f5f9]',
      surfaceContainerLowest: 'bg-[#ffffff]',
      border: 'border-slate-200 border',
      textPrimary: 'text-[#0f172a]',
      textMuted: 'text-[#64748b]',
      primaryAccent: 'text-indigo-600 bg-indigo-50',
      primaryAccentHover: 'hover:bg-indigo-600 hover:text-white',
      primaryText: 'text-[#6366f1]',
      secondaryAccent: 'text-[#0f172a]',
      secondaryText: 'text-[#0f172a]',
      glassEffect: 'bg-white/80 border border-slate-200 shadow-md backdrop-blur-md',
      borderRadius: 'rounded-2xl',
      fontFamilyDisplay: 'font-display',
      fontFamilyBody: 'font-sans',
      buttonPrimaryBg: 'bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all duration-200',
      buttonPrimaryText: 'text-white font-bold',
      buttonSecondaryBg: 'bg-transparent border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200',
      buttonSecondaryText: 'text-slate-700 font-bold',
      inputBg: 'bg-white',
      inputBorder: 'border border-slate-200 focus:border-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      badgeText: 'text-indigo-700 font-bold',
      glow: 'shadow-md',
      cardBorder: 'border-slate-200 border'
    }
  },
  {
    id: 'bold-typography-dark',
    name: 'Impeccable Obsidian (Dark)',
    description: 'Giao diện tối tối giản cao cấp (obsidian black) kết hợp các điểm nhấn màu xanh trời rực rỡ và hiệu ứng kính mờ tinh tế.',
    styles: {
      background: 'bg-[#09090b]',
      surface: 'bg-[#18181b]',
      surfaceContainer: 'bg-[#27272a]',
      surfaceContainerLowest: 'bg-[#09090b]',
      border: 'border-sky-500/20 border',
      textPrimary: 'text-[#fafafa]',
      textMuted: 'text-[#a1a1aa]',
      primaryAccent: 'text-sky-400 bg-sky-950/30',
      primaryAccentHover: 'hover:bg-sky-500 hover:text-slate-950',
      primaryText: 'text-[#38bdf8]',
      secondaryAccent: 'text-[#4ade80]',
      secondaryText: 'text-[#fafafa]',
      glassEffect: 'bg-[#18181b]/80 border border-sky-500/20 shadow-lg backdrop-blur-md',
      borderRadius: 'rounded-2xl',
      fontFamilyDisplay: 'font-display',
      fontFamilyBody: 'font-sans',
      buttonPrimaryBg: 'bg-sky-500 text-slate-950 rounded-xl shadow-lg hover:bg-sky-400 transition-all duration-200',
      buttonPrimaryText: 'text-slate-950 font-bold',
      buttonSecondaryBg: 'bg-transparent border border-sky-500/20 text-slate-300 rounded-xl hover:bg-slate-800 transition-all duration-200',
      buttonSecondaryText: 'text-slate-300 font-bold',
      inputBg: 'bg-[#18181b]',
      inputBorder: 'border border-sky-500/20 focus:border-sky-500',
      badgeBg: 'bg-[#18181b] text-slate-200 border border-sky-500/20',
      badgeText: 'text-slate-200 font-bold',
      glow: 'shadow-lg shadow-sky-500/10',
      cardBorder: 'border-sky-500/20 border'
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
