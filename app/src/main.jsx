import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AuthGate from './components/AuthGate.jsx'
import { FeedProvider } from './context/FeedContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <AppProvider>
          <ToastProvider>
            <FeedProvider>
              <ChatProvider>
                <App />
              </ChatProvider>
            </FeedProvider>
          </ToastProvider>
        </AppProvider>
      </AuthGate>
    </AuthProvider>
  </StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/portal/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
