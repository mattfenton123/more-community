import { useAuth } from '../context/AuthContext';
import LoginScreen from '../views/LoginScreen';

/**
 * AuthGate wraps the entire app.
 * - If auth is loading: show splash
 * - If no session: show LoginScreen
 * - If session exists: render children (the app)
 */
export default function AuthGate({ children }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--slate-950)',
        color: 'white',
        gap: '16px',
      }}>
        <img src={`/images/logo.webp`} alt="more." style={{ height: '28px', opacity: 0.8 }} />
        <div className="skeleton" style={{ width: '120px', height: '4px', borderRadius: '99px' }} />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return children;
}
