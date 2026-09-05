import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Video } from 'lucide-react';
import { uploadVideoAction } from '../lib/actions';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function VideoUploader({ onUploadComplete, onCancel, user, token }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(10);
    
    let fileToUpload = file;
    
    try {
      setStatusText('Compressing video (this may take a moment)...');
      
      const ffmpeg = ffmpegRef.current;
      
      // Load ffmpeg if not loaded
      if (!ffmpeg.loaded) {
        // We use the core URL from unpkg to bypass some strict CORS requirements if possible,
        // or just use default. For MVP, we attempt default load.
        await ffmpeg.load();
      }

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(10 + Math.round(p * 50)); // 10% to 60% for compression
      });

      const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
      const outputName = 'output.mp4';
      
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Compress: scale to max 720p height, 30fps, fast preset to save time
      await ffmpeg.exec([
        '-i', inputName,
        '-vf', 'scale=-2:720',
        '-r', '30',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '28',
        outputName
      ]);
      
      const data = await ffmpeg.readFile(outputName);
      fileToUpload = new File([data.buffer], 'highlight.mp4', { type: 'video/mp4' });
      setStatusText('Compression complete. Uploading...');
      
    } catch (err) {
      console.warn("FFmpeg compression failed, falling back to raw upload:", err);
      setStatusText('Uploading raw video...');
    }

    setProgress(65);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      if (user?.id) formData.append('userId', user.id);
      
      // We simulate progress for the actual upload part
      const uploadInterval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 5 : p));
      }, 500);

      const url = await uploadVideoAction(formData, token);
      
      clearInterval(uploadInterval);
      setProgress(100);
      setStatusText('Upload successful!');
      
      setTimeout(() => {
        onUploadComplete(url);
      }, 1000);
      
    } catch (err) {
      console.error("Upload error:", err);
      setStatusText('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--slate-900)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative' }}>
        
        <button 
          onClick={onCancel}
          disabled={isUploading}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: isUploading ? 'not-allowed' : 'pointer' }}
        >
          <X size={18} />
        </button>

        <div style={{ width: '64px', height: '64px', background: 'rgba(20,184,166,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--teal-400)' }}>
          <Video size={32} />
        </div>
        
        <h3 style={{ fontSize: '1.4rem', color: 'var(--white)', margin: '0 0 12px 0', fontFamily: 'var(--font-heading)' }}>Upload Highlight</h3>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '32px', lineHeight: 1.5 }}>
          Share a quick video highlight from this community. Max length is 60 seconds.
        </p>

        {!isUploading ? (
          <div>
            <input 
              type="file" 
              accept="video/*" 
              capture="environment"
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary interactive-press"
              style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Upload size={20} /> Select Video
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Loader2 size={32} color="var(--teal-400)" className="spin" style={{ marginBottom: '16px' }} />
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal-500)', transition: 'width 0.3s' }} />
            </div>
            <p style={{ color: 'var(--teal-400)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
              {statusText} ({progress}%)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
