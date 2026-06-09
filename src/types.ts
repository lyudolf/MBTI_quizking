export type Category = 'general' | 'science' | 'history' | 'culture' | 'economy' | 'life' | 'tech' | 'art';

export interface Question {
  id: string;
  category: Category;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export type RankType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export interface CategoryProgress {
  totalAnswered: number;
  correctAnswered: number;
  answeredIds: string[];
}

export interface WrongNote {
  questionId: string;
  category: Category;
  wrongDate: string; // YYYY-MM-DD
}

export interface Title {
  id: string;
  category: Category;
  name: string;
  description: string;
  icon: string;
}

export const CATEGORIES: Record<Category, { name: string; icon: string }> = {
  general: { name: '일반상식', icon: '🌍' },
  science: { name: '과학', icon: '🔬' },
  history: { name: '역사', icon: '📜' },
  culture: { name: '대중문화', icon: '🎬' },
  economy: { name: '경제/금융', icon: '💰' },
  life: { name: '생활/음식', icon: '🍳' },
  tech: { name: 'IT/기술', icon: '🌐' },
  art: { name: '음악/예술', icon: '🎵' },
};

export const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP'
] as const;

export type MbtiType = typeof MBTI_TYPES[number];
