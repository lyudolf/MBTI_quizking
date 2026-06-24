import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/useGameStore';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import ProfilePage from './pages/ProfilePage';
import WrongNotePage from './pages/WrongNotePage';
import DailyChallengePage from './pages/DailyChallengePage';
import RankingPage from './pages/RankingPage';
import { AttendanceModal } from './components/AttendanceModal';

function AppRoutes() {
  const nickname = useGameStore((s) => s.nickname);
  const mbtiType = useGameStore((s) => s.mbtiType);
  const checkDailyReset = useGameStore((s) => s.checkDailyReset);
  const ensureUserId = useGameStore((s) => s.ensureUserId);

  useEffect(() => {
    ensureUserId();
    checkDailyReset();
  }, [ensureUserId, checkDailyReset]);

  const isOnboarded = nickname !== null && mbtiType !== null;

  return (
    <Routes>
      <Route
        path="/"
        element={isOnboarded ? <Navigate to="/home" replace /> : <OnboardingPage />}
      />
      <Route
        path="/home"
        element={isOnboarded ? <HomePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/category"
        element={isOnboarded ? <CategoryPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/quiz"
        element={isOnboarded ? <QuizPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/result"
        element={isOnboarded ? <ResultPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/profile"
        element={isOnboarded ? <ProfilePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/wrong-notes"
        element={isOnboarded ? <WrongNotePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/daily"
        element={isOnboarded ? <DailyChallengePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/ranking"
        element={isOnboarded ? <RankingPage /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
      <AttendanceModal />
    </HashRouter>
  );
}

export default App;
