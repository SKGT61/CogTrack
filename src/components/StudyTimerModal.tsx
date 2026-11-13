import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Check, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { LearningDomain } from '../types/learning';

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: LearningDomain[];
  onCompleteSession: (domainId: string, durationMinutes: number) => void;
}

export const StudyTimerModal: React.FC<StudyTimerModalProps> = ({
  isOpen,
  onClose,
  domains,
  onCompleteSession,
}) => {
  const [selectedDomainId, setSelectedDomainId] = useState<string>(domains[0]?.id || '');
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'deep' | 'stopwatch'>('pomodoro');
  const [targetSeconds, setTargetSeconds] = useState<number>(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerMode === 'pomodoro') {
      setTargetSeconds(25 * 60);
      setElapsedSeconds(0);
      setIsActive(false);
    } else if (timerMode === 'deep') {
      setTargetSeconds(50 * 60);
      setElapsedSeconds(0);
      setIsActive(false);
    } else if (timerMode === 'stopwatch') {
      setTargetSeconds(0);
      setElapsedSeconds(0);
      setIsActive(false);
    }
  }, [timerMode]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (timerMode !== 'stopwatch' && next >= targetSeconds) {
            setIsActive(false);
            if (soundEnabled) {
              playChime();
            }
            return targetSeconds;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, targetSeconds, timerMode, soundEnabled]);

  if (!isOpen) return null;

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime unsupported:', e);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setElapsedSeconds(0);
  };

  const handleFinishAndLog = () => {
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    onCompleteSession(selectedDomainId, minutes);
    handleReset();
    onClose();
  };

  const secondsToDisplay = timerMode === 'stopwatch' ? elapsedSeconds : Math.max(0, targetSeconds - elapsedSeconds);
  const minutes = Math.floor(secondsToDisplay / 60);
  const seconds = secondsToDisplay % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = timerMode === 'stopwatch' ? 100 : Math.min(100, (elapsedSeconds / targetSeconds) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Temporizador de Enfoque Profundo</h3>
            <p className="text-xs text-slate-400">
              Registra tu tiempo de estudio continuo en tus dominios de aprendizaje.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Domain selector */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Dominio de Aprendizaje
          </label>
          <select
            value={selectedDomainId}
            onChange={(e) => setSelectedDomainId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.subArea})
              </option>
            ))}
          </select>
        </div>

        {/* Mode selector */}
        <div className="mt-3 flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setTimerMode('pomodoro')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
              timerMode === 'pomodoro'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pomodoro (25m)
          </button>
          <button
            type="button"
            onClick={() => setTimerMode('deep')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
              timerMode === 'deep'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bloque Largo (50m)
          </button>
          <button
            type="button"
            onClick={() => setTimerMode('stopwatch')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
              timerMode === 'stopwatch'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cronómetro Libre
          </button>
        </div>

        {/* Timer Display */}
        <div className="my-8 text-center">
          <div className="text-6xl font-bold font-mono tabular-nums tracking-tight text-white mb-2">
            {formattedTime}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {timerMode === 'stopwatch'
              ? `Tiempo transcurrido: ${Math.floor(elapsedSeconds / 60)} min`
              : `${Math.round(progressPercent)}% completado (${Math.floor(elapsedSeconds / 60)} min)`}
          </div>

          <div className="mt-4 mx-auto max-w-xs w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-indigo-500 hover:bg-indigo-400 text-slate-950 shadow-md'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? 'Pausar' : 'Iniciar'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title={soundEnabled ? 'Silenciar sonido de fin' : 'Activar sonido de fin'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Finish & Record Button */}
        {elapsedSeconds >= 60 && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={handleFinishAndLog}
              className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Finalizar y Registrar ({Math.round(elapsedSeconds / 60)} min)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
