import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { MBTI_TYPES } from '../types';

const MBTI_GROUPS: Record<string, string> = {
  INTJ: 'analyst', INTP: 'analyst', ENTJ: 'analyst', ENTP: 'analyst',
  INFJ: 'diplomat', INFP: 'diplomat', ENFJ: 'diplomat', ENFP: 'diplomat',
  ISTJ: 'sentinel', ISFJ: 'sentinel', ESTJ: 'sentinel', ESFJ: 'sentinel',
  ISTP: 'explorer', ISFP: 'explorer', ESTP: 'explorer', ESFP: 'explorer',
};

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,8}$/;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setOnboarding = useGameStore((s) => s.setOnboarding);

  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null);

  const validateNickname = (value: string) => {
    if (value.length === 0) {
      setNicknameError('');
      return false;
    }
    if (value.length < 2) {
      setNicknameError('2자 이상 입력해주세요');
      return false;
    }
    if (value.length > 8) {
      setNicknameError('8자 이하로 입력해주세요');
      return false;
    }
    if (!NICKNAME_REGEX.test(value)) {
      setNicknameError('한글, 영문, 숫자만 사용 가능해요');
      return false;
    }
    setNicknameError('');
    return true;
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    validateNickname(value);
  };

  const handleNextStep = () => {
    if (validateNickname(nickname)) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (!selectedMbti || !NICKNAME_REGEX.test(nickname)) return;
    setOnboarding(nickname, selectedMbti);
    navigate('/home', { replace: true });
  };

  const isNicknameValid = NICKNAME_REGEX.test(nickname);
  const canSubmit = isNicknameValid && selectedMbti !== null;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: step === 1 ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
          transition: 'background var(--transition-normal)',
        }} />
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: step === 2 ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
          transition: 'background var(--transition-normal)',
        }} />
      </div>

      {step === 1 && (
        <div style={{ animation: 'slideUp var(--transition-normal)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              반가워요!
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              퀴즈왕에서 사용할 닉네임을 정해주세요
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <input
              className={`text-input ${nicknameError ? 'error' : ''}`}
              type="text"
              placeholder="닉네임 (2-8자)"
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={8}
              autoFocus
            />
            {nicknameError && (
              <p className="input-helper error">{nicknameError}</p>
            )}
            {!nicknameError && nickname.length > 0 && isNicknameValid && (
              <p className="input-helper" style={{ color: 'var(--color-success)' }}>
                사용 가능한 닉네임이에요 ✓
              </p>
            )}
          </div>

          <button
            className="btn btn-primary btn-xl"
            disabled={!isNicknameValid}
            onClick={handleNextStep}
          >
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: 'slideIn var(--transition-normal)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              MBTI를 선택해주세요
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              {nickname}님의 MBTI 유형은 무엇인가요?
            </p>
          </div>

          {/* Group labels */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            <span style={{ color: 'var(--mbti-analyst)' }}>분석가</span>
            <span style={{ color: 'var(--mbti-diplomat)' }}>외교관</span>
            <span style={{ color: 'var(--mbti-sentinel)' }}>관리자</span>
            <span style={{ color: 'var(--mbti-explorer)' }}>탐험가</span>
          </div>

          <div className="mbti-grid" style={{ marginBottom: '32px' }}>
            {MBTI_TYPES.map((type) => {
              const group = MBTI_GROUPS[type];
              const isSelected = selectedMbti === type;
              return (
                <button
                  key={type}
                  className={`mbti-chip ${group} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedMbti(type)}
                >
                  {type}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setStep(1)}
              style={{ flex: '0 0 auto', width: 'auto', padding: '14px 24px' }}
            >
              ← 이전
            </button>
            <button
              className="btn btn-primary btn-xl"
              disabled={!canSubmit}
              onClick={handleSubmit}
              style={{ flex: 1 }}
            >
              시작하기 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
