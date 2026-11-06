import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, AlertTriangle, WifiOff, Trees, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [queuedCount, setQueuedCount] = useState(0);

  const updateQueueCount = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('more_offline_checkin_queue');
      const queue = raw ? JSON.parse(raw) : [];
      setQueuedCount(Array.isArray(queue) ? queue.length : 0);
    } catch (e) {
      setQueuedCount(0);
    }
  };

  useEffect(() => {
    updateQueueCount();
    const handleOnline = () => { setIsOffline(false); updateQueueCount(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let stream = null;
    let requestAnimationId = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          videoRef.current.play();
          requestAnimationId = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    const tick = () => {
      if (!scanning) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          setScanning(false); // Stop scanning momentarily
          
          // Haptic vibration feedback on mobile devices
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([100, 50, 100]); } catch (e) {}
          }

          // Try to parse JSON if the QR contains it, otherwise send raw data
          let payload = code.data;
          try {
            payload = JSON.parse(code.data);
          } catch(e) {}
          
          onScan(payload);
          setTimeout(updateQueueCount, 300);
          
          // Resume scanning after 2 seconds
          setTimeout(() => setScanning(true), 2000);
        }
      }
      
      if (scanning) {
        requestAnimationId = requestAnimationFrame(tick);
      }
    };

    startCamera();

    return () => {
      setScanning(false);
      if (requestAnimationId) cancelAnimationFrame(requestAnimationId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanning, onScan]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--slate-950)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={20} /> Scan Ticket
        </h2>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      {/* Offline Trail Mode Status Bar */}
      <div style={{
        marginTop: '70px',
        padding: '8px 16px',
        background: isOffline ? 'rgba(239, 68, 68, 0.25)' : 'rgba(13, 148, 136, 0.25)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.78rem',
        fontWeight: 600,
        color: isOffline ? '#fca5a5' : '#5eead4',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOffline ? <WifiOff size={15} /> : <Trees size={15} />}
          <span>{isOffline ? '🌲 Zero-Signal Trail Mode: Check-ins Queued Locally' : '📶 Leader Live Scanner'}</span>
        </div>
        {queuedCount > 0 && (
          <span style={{
            background: 'rgba(245, 158, 11, 0.25)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            padding: '2px 8px',
            borderRadius: '99px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            {queuedCount} queued to sync
          </span>
        )}
      </div>

      {/* Camera Viewport */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
            <AlertTriangle size={48} style={{ margin: '0 auto 16px' }} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Target Overlay */}
            <div style={{ 
              position: 'absolute', 
              width: '250px', 
              height: '250px', 
              border: '2px dashed rgba(255,255,255,0.5)', 
              borderRadius: '24px',
              boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)'
            }}>
              {!scanning && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.3)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 'bold', background: '#22c55e', padding: '4px 12px', borderRadius: '99px' }}>Scanned!</span>
                </div>
              )}
            </div>
            
            <div style={{ position: 'absolute', bottom: '40px', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '99px' }}>
              Align QR Code within the frame
            </div>
          </>
        )}
      </div>
    </div>
  );
}
