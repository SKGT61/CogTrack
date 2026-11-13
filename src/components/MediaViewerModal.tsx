import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { ConceptMediaAttachment } from '../types/learning';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: ConceptMediaAttachment | null;
  conceptTitle?: string;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  attachment,
  conceptTitle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsZoomed(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [attachment?.id, isOpen]);

  if (!isOpen || !attachment) return null;

  // Audio source URL: prefer webContentLink / direct stream or Drive preview
  const audioStreamUrl =
    attachment.downloadUrl ||
    `https://drive.google.com/uc?export=download&id=${attachment.driveFileId}`;

  // Image URL: prefer webViewLink or thumbnail or direct export
  const imageDisplayUrl =
    attachment.thumbnailLink
      ? attachment.thumbnailLink.replace(/=s\d+/, '=s1600')
      : `https://drive.google.com/uc?export=view&id=${attachment.driveFileId}`;

  const pdfPreviewUrl = `https://drive.google.com/file/d/${attachment.driveFileId}/preview`;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.warn('Audio play error:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds)
      );
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-left">
        {/* Header Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-900/95">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-indigo-400 capitalize">
                {attachment.mediaType === 'image'
                  ? 'Imagen'
                  : attachment.mediaType === 'audio'
                  ? 'Grabación de Audio'
                  : attachment.mediaType === 'pdf'
                  ? 'Documento PDF'
                  : 'Archivo Multimedia'}
              </span>
              {conceptTitle && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{conceptTitle}</span>
                </>
              )}
              {attachment.sizeBytes > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{formatFileSize(attachment.sizeBytes)}</span>
                </>
              )}
            </div>
            <h3 className="text-base font-bold text-white truncate mt-0.5">
              {attachment.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {attachment.webViewLink && (
              <a
                href={attachment.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Abrir en Google Drive"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/60 min-h-[300px]">
          {/* IMAGE VIEWER */}
          {attachment.mediaType === 'image' && (
            <div className="flex flex-col items-center justify-center w-full h-full space-y-3">
              <div
                className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition-all ${
                  isZoomed ? 'cursor-zoom-out max-h-none' : 'cursor-zoom-in max-h-[65vh]'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <img
                  src={imageDisplayUrl}
                  alt={attachment.name}
                  referrerPolicy="no-referrer"
                  className={`object-contain mx-auto transition-transform duration-200 ${
                    isZoomed ? 'scale-125' : 'scale-100 max-h-[60vh] w-auto'
                  }`}
                  onError={(e) => {
                    // Fallback to webViewLink if direct preview fails
                    if (attachment.webViewLink) {
                      (e.target as HTMLElement).style.display = 'none';
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                  <span>{isZoomed ? 'Restablecer zoom' : 'Ampliar detalle'}</span>
                </button>
              </div>
            </div>
          )}

          {/* AUDIO PLAYER */}
          {attachment.mediaType === 'audio' && (
            <div className="w-full max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 flex items-center justify-center shrink-0">
                  <Volume2 className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-white truncate">{attachment.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reproducción de alta fidelidad desde Google Drive
                  </p>
                </div>
              </div>

              <audio
                ref={audioRef}
                src={audioStreamUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              {/* Seek bar */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => skipSeconds(-5)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Retroceder 5 segundos"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-lg"
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => skipSeconds(5)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Adelantar 5 segundos"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Playback speed buttons */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  {[0.75, 1, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => changeSpeed(speed)}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        playbackSpeed === speed
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PDF VIEWER */}
          {attachment.mediaType === 'pdf' && (
            <div className="w-full h-full flex flex-col space-y-3 min-h-[500px]">
              <div className="w-full flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <iframe
                  src={pdfPreviewUrl}
                  title={attachment.name}
                  className="w-full h-full min-h-[500px] border-0"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Visor de PDF integrado de Google Drive</span>
                {attachment.webViewLink && (
                  <a
                    href={attachment.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <span>Abrir en pestaña completa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* OTHER / GENERIC FILE */}
          {attachment.mediaType === 'other' && (
            <div className="text-center p-8 space-y-4">
              <FileText className="w-16 h-16 mx-auto text-indigo-400" />
              <h4 className="text-lg font-bold text-white">{attachment.name}</h4>
              <p className="text-xs text-slate-400 max-w-md">
                Este tipo de archivo está respaldado de manera segura en tu Google Drive. Puedes abrirlo directamente o descargarlo.
              </p>
              {attachment.webViewLink && (
                <a
                  href={attachment.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir en Google Drive</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Caption */}
        {attachment.caption && (
          <div className="p-3 sm:px-6 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 mr-1.5">Nota / Leyenda:</span>
            <span>{attachment.caption}</span>
          </div>
        )}
      </div>
    </div>
  );
};
