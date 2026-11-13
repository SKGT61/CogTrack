import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Settings, Check, AlertCircle, Cloud, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { UserPreferences, GoogleDriveSyncStatus } from '../types/learning';
import { AppStateData } from '../utils/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onExportBackup: () => void;
  onImportBackup: (data: AppStateData) => void;
  onResetDefaults: () => void;
  driveSyncStatus?: GoogleDriveSyncStatus;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  onSyncWithDrive?: () => void;
  onRestoreFromDrive?: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  driveSyncStatus,
  onSignInGoogle,
  onSignOutGoogle,
  onSyncWithDrive,
  onRestoreFromDrive,
}) => {
  const [dailyMinutes, setDailyMinutes] = useState(preferences.dailyGoalMinutes);
  const [weeklyHours, setWeeklyHours] = useState(preferences.weeklyGoalHours);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      ...preferences,
      dailyGoalMinutes: Number(dailyMinutes) || 60,
      weeklyGoalHours: Number(weeklyHours) || 10,
    });
    setStatusMsg('Preferencias de objetivos actualizadas correctamente.');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if ((json.domains || json.subjects) && json.logs && json.goals) {
          const formattedData: AppStateData = {
            domains: json.domains || json.subjects,
            folders: json.folders || [],
            macroDomains: json.macroDomains || [],
            concepts: json.concepts || [],
            conceptFolders: json.conceptFolders || [],
            logs: json.logs,
            goals: json.goals,
            preferences: json.preferences || preferences,
            weeklyPlans: json.weeklyPlans || [],
            archivedLessons: json.archivedLessons || [],
            difficultyTracks: json.difficultyTracks || [],
          };
          onImportBackup(formattedData);
          setStatusMsg('Copia de seguridad restaurada exitosamente.');
          setTimeout(() => {
            setStatusMsg(null);
            onClose();
          }, 1500);
        } else {
          alert('El archivo JSON no tiene el formato válido de CognitiveTrack.');
        }
      } catch (err) {
        console.error('Error importing JSON:', err);
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Configuración y Datos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Global Goals Form */}
        <form onSubmit={handleSavePreferences} className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Objetivos Globales de Estudio
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Meta Diaria (minutos)
              </label>
              <input
                type="number"
                min="10"
                max="720"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Meta Semanal (horas)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Guardar Objetivos
          </button>
        </form>

        {/* Google Drive Cloud Sync */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sincronización en la Nube (Google Drive)</span>
            </h4>
            {driveSyncStatus?.isSignedIn && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conectado
              </span>
            )}
          </div>

          {driveSyncStatus?.isSignedIn ? (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {driveSyncStatus.userName || driveSyncStatus.userEmail}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{driveSyncStatus.userEmail}</p>
                </div>
                {onSignOutGoogle && (
                  <button
                    type="button"
                    onClick={onSignOutGoogle}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="Desconectar cuenta de Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Desconectar</span>
                  </button>
                )}
              </div>

              {driveSyncStatus.lastSyncedAt && (
                <div className="text-[10px] font-mono text-slate-400">
                  Último respaldo: {new Date(driveSyncStatus.lastSyncedAt).toLocaleString()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onSyncWithDrive}
                  disabled={driveSyncStatus.isSyncing}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${driveSyncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{driveSyncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                </button>

                <button
                  type="button"
                  onClick={onRestoreFromDrive}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Restaurar de Drive</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <p className="font-semibold text-white">Sincroniza y expande tu almacenamiento</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Conecta tu cuenta de Google Drive para respaldar automáticamente tus lecciones, audios y documentos.
                </p>
              </div>
              {onSignInGoogle && (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>Conectar con Google</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Backup and Restore */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Respaldo Local (Archivo JSON)
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <Download className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white block">Exportar JSON</span>
              <span className="text-[11px] text-slate-500 block">Descargar copia local</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <Upload className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white block">Importar JSON</span>
              <span className="text-[11px] text-slate-500 block">Cargar archivo previo</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Reset defaults */}
        <div className="pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas restablecer todos los datos a las disciplinas y sesiones iniciales de muestra?')) {
                onResetDefaults();
                setStatusMsg('Datos de muestra restablecidos.');
                setTimeout(() => setStatusMsg(null), 2000);
              }
            }}
            className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 border border-rose-900/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Demostración</span>
          </button>
        </div>
      </div>
    </div>
  );
};
