import { useGameStore } from '../store/useGameStore';
import { rewardForDay, rewardText } from '../utils/attendanceReward';

/** 새로운 날 접속 시 출석 보상을 알리는 팝업 (보상은 이미 자동 지급됨) */
export function AttendanceModal() {
  const day = useGameStore((s) => s.pendingAttendanceDay);
  const dismiss = useGameStore((s) => s.dismissAttendanceReward);

  if (!day || day <= 0) return null;

  const reward = rewardForDay(day);

  return (
    <div className="modal-overlay" onClick={dismiss}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-emoji">📅</div>
        <div className="modal-title">출석 {day}일째!</div>
        <p className="modal-desc">
          출석 보상을 받았어요
          <br />
          <strong style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
            {rewardText(reward)}
          </strong>
        </p>
        <button className="btn btn-primary btn-lg" onClick={dismiss}>
          확인
        </button>
      </div>
    </div>
  );
}
