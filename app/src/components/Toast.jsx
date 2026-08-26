"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message = '') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, type, title, message }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
      );
      // Remove from DOM after exit animation completes
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 3000);

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const toast = {
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    info: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.exiting ? 'exiting' : ''}`}>
            <div className={`toast-icon ${t.type}`}>
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'info' && 'ℹ'}
            </div>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button className="toast-dismiss" onClick={() => dismissToast(t.id)}>×</button>
            <div className={`toast-progress ${t.type}`} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
