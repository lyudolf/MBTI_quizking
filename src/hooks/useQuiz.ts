import { useState, useCallback, useRef, useEffect } from 'react';
import type { Category, Question } from '../types';
import { useGameStore } from '../store/useGameStore';

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  answers: Array<{
    questionId: string;
    selectedIndex: number;
    correct: boolean;
    timeSpent: number;
  }>;
  totalTimeSpent: number[];
}

interface UseQuizOptions {
  category: Category;
  questionCount?: number;
  questions: Question[];
}

interface UseQuizReturn {
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  selectAnswer: (answerIndex: number) => void;
  isComplete: boolean;
  results: QuizResult | null;
  timeLeft: number;
  startTimer: () => void;
  isStarted: boolean;
}

const TIME_LIMIT_PER_QUESTION = 15; // 15초

export function useQuiz({ category, questionCount = 30, questions }: UseQuizOptions): UseQuizReturn {
  const categoryProgress = useGameStore(state => state.categoryProgress);

  // 이미 답한 문제 필터링 후 랜덤 선택
  const [selectedQuestions] = useState<Question[]>(() => {
    const answered = categoryProgress[category]?.answeredIds ?? [];
    const unanswered = questions.filter(q => !answered.includes(q.id));

    // 미답 문제가 부족하면 전체에서 보충
    let pool: Question[];
    if (unanswered.length >= questionCount) {
      pool = unanswered;
    } else {
      pool = [...questions];
    }

    // Fisher-Yates shuffle
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
  });

  const [questionIndex, setQuestionIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_PER_QUESTION);
  const [answers, setAnswers] = useState<QuizResult['answers']>([]);
  const [results, setResults] = useState<QuizResult | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startQuestionTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(TIME_LIMIT_PER_QUESTION);
    questionStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    setIsStarted(true);
    startQuestionTimer();
  }, [startQuestionTimer]);

  // 타임아웃 시 자동으로 오답 처리
  useEffect(() => {
    if (timeLeft === 0 && isStarted && !isComplete) {
      selectAnswer(-1); // -1 = 시간 초과 (오답)
    }
  }, [timeLeft, isStarted, isComplete]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const selectAnswer = useCallback(
    (answerIndex: number) => {
      if (isComplete || questionIndex >= selectedQuestions.length) return;

      clearTimer();

      const currentQ = selectedQuestions[questionIndex];
      const timeSpent = (Date.now() - questionStartRef.current) / 1000;
      const correct = answerIndex === currentQ.answer;

      const newAnswer = {
        questionId: currentQ.id,
        selectedIndex: answerIndex,
        correct,
        timeSpent,
      };

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      const nextIndex = questionIndex + 1;

      if (nextIndex >= selectedQuestions.length) {
        // 퀴즈 완료
        clearTimer();
        const totalTimeSpent = updatedAnswers.map(a => a.timeSpent);
        const correctCount = updatedAnswers.filter(a => a.correct).length;

        const quizResult: QuizResult = {
          totalQuestions: selectedQuestions.length,
          correctCount,
          accuracy: selectedQuestions.length > 0 ? correctCount / selectedQuestions.length : 0,
          answers: updatedAnswers,
          totalTimeSpent,
        };

        setResults(quizResult);
        setIsComplete(true);
      } else {
        setQuestionIndex(nextIndex);
        // 다음 문제 타이머 시작
        setTimeout(() => {
          startQuestionTimer();
        }, 0);
      }
    },
    [isComplete, questionIndex, selectedQuestions, answers, clearTimer, startQuestionTimer]
  );

  const currentQuestion =
    questionIndex < selectedQuestions.length ? selectedQuestions[questionIndex] : null;

  return {
    currentQuestion,
    questionIndex,
    totalQuestions: selectedQuestions.length,
    selectAnswer,
    isComplete,
    results,
    timeLeft,
    startTimer,
    isStarted,
  };
}
