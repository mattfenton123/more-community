"use client";
import { useEffect, useRef, useState } from 'react';
import { X, Camera, CheckCircle2, AlertCircle, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let animationId;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions.');
      }
    };

    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || !scanning) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setScanning(false);
          try {
            const data = JSON.parse(code.data);
            if (data.type === 'more_ticket') {
              setResult(data);
              if (onScan) onScan(data);
            } else {
              setError('Invalid ticket QR code');
              setTimeout(() => { setError(null); setScanning(true); }, 2000);
            }
          } catch {
            setError('Could not read QR code');
            setTimeout(() => { setError(null); setScanning(true); }, 2000);
          }
        }
      }
      
      animationId = requestAnimationFrame(scanFrame);
    };

    startCamera().then(() => {
      animationId = requestAnimationFrame(scanFrame);
    });

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanning, onScan]);

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', zIndex: 10001 }}>
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <Camera size={20} />
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>Scan Ticket</h2>
        </div>
        <button onClick={handleClose} className="interactive-press" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>
      </div>

      {/* Camera Feed */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Scanner overlay */}
        {scanning && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              width: '240px', height: '240px', 
              border: '3px solid var(--teal-400)', 
              borderRadius: '24px',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ScanLine size={16} color="var(--teal-400)" /> Point at ticket QR code
              </div>
            </div>
          </div>
        )}

        {/* Success overlay */}
        {result && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <CheckCircle2 size={64} color="var(--teal-400)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>Checked In!</h3>
            <p style={{ color: 'var(--slate-300)', margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>{result.userName}</p>
            <p style={{ color: 'var(--slate-400)', margin: '0 0 24px 0', fontSize: '0.85rem' }}>{result.eventTitle}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setResult(null); setScanning(true); }} className="btn btn-primary interactive-press" style={{ padding: '12px 24px', borderRadius: '10px' }}>
                Scan Next
              </button>
              <button onClick={handleClose} className="btn btn-outline interactive-press" style={{ padding: '12px 24px', borderRadius: '10px' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <AlertCircle size={48} color="var(--rose-500)" style={{ marginBottom: '16px' }} />
            <p style={{ color: 'var(--slate-300)', textAlign: 'center', margin: 0 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
