import { Plus, Timer, Database, Flame, Brain, Archive, Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';
import { StreakInfo } from '../utils/analytics';
import { GoogleDriveSyncStatus } from '../types/learning';

interface HeaderProps {
  currentTab: 'dashboard' | 'logs' | 'domains' | 'lessons' | 'goals';
  onSelectTab: (tab: 'dashboard' | 'logs' | 'domains' | 'lessons' | 'goals') => void;
  onOpenLogModal: () => void;
  onOpenTimerModal: () => void;
  onOpenDataModal: () => void;
  onOpenArchivedModal?: () => void;
  archivedCount?: number;
  streakInfo: StreakInfo;
  driveSyncStatus?: GoogleDriveSyncStatus;
  onSignInGoogle?: () => void;
  onSyncNow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogModal,
  onOpenTimerModal,
  onOpenDataModal,
  onOpenArchivedModal,
  archivedCount = 0,
  streakInfo,
  driveSyncStatus,
  onSignInGoogle,
  onSyncNow,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, one line */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors whitespace-nowrap">
              CognitiveTrack
            </span>
          </button>

          {/* Quick Streak indicator (clean unboxed metadata) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums pl-3 border-l border-slate-800">
            <Flame className={`w-3.5 h-3.5 ${streakInfo.currentStreak > 0 ? 'text-amber-400 fill-amber-400/20' : 'text-slate-600'}`} />
            <span className="text-slate-200 font-medium">{streakInfo.currentStreak} d racha</span>
            {streakInfo.studiedToday ? (
              <span className="text-emerald-400">· hoy activo</span>
            ) : (
              <span className="text-slate-500">· pendiente hoy</span>
            )}
          </div>
        </div>

        {/* Zone 2: 5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentTab === 'dashboard' ? 'text-white font-semibold' : ''
            }`}
          >
            Panel General
          </button>
          <button
            onClick={() => onSelectTab('logs')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentTab === 'logs' ? 'text-white font-semibold' : ''
            }`}
          >
            Progreso Diario
          </button>
          <button
            onClick={() => onSelectTab('domains')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentTab === 'domains' ? 'text-white font-semibold' : ''
            }`}
          >
            Dominios
          </button>
          <button
            onClick={() => onSelectTab('lessons')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentTab === 'lessons' ? 'text-white font-semibold' : ''
            }`}
          >
            Lecciones
          </button>
          <button
            onClick={() => onSelectTab('goals')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentTab === 'goals' ? 'text-white font-semibold' : ''
            }`}
          >
            Metas
          </button>
        </nav>

        {/* Zone 3: Actions - Timer, Data manager, Archive and 1 Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenArchivedModal && (
            <button
              onClick={onOpenArchivedModal}
              title="Lecciones Archivadas (Historial completo por fecha)"
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-xs font-medium text-slate-300">Archivadas</span>
              {archivedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/90 text-slate-950 font-bold text-[10px] leading-tight">
                  {archivedCount}
                </span>
              )}
            </button>
          )}
          {/* Google Drive Status & Manual Sync */}
          {driveSyncStatus?.isSignedIn ? (
            <button
              type="button"
              onClick={onSyncNow}
              title={
                driveSyncStatus.lastSyncedAt
                  ? `Google Drive sincronizado (${driveSyncStatus.userEmail}). Último: ${new Date(driveSyncStatus.lastSyncedAt).toLocaleTimeString()}`
                  : `Google Drive conectado (${driveSyncStatus.userEmail}). Haz clic para sincronizar.`
              }
              className="flex items-center gap-1.5 p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer text-xs"
            >
              {driveSyncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden lg:inline text-[11px] font-mono text-slate-400">
                {driveSyncStatus.isSyncing ? 'Sincronizando' : 'Drive Sync'}
              </span>
            </button>
          ) : (
            onSignInGoogle && (
              <button
                type="button"
                onClick={onSignInGoogle}
                title="Conectar Google Drive para respaldos y archivos multimedia"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Conectar Drive</span>
              </button>
            )
          )}
          <button
            onClick={onOpenTimerModal}
            title="Temporizador de estudio / Pomodoro"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <Timer className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenDataModal}
            title="Configuración y Respaldo de Datos"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Avance</span>
          </button>
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-slate-950 text-xs">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2 py-1 ${currentTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Panel
        </button>
        <button
          onClick={() => onSelectTab('logs')}
          className={`px-2 py-1 ${currentTab === 'logs' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Historial
        </button>
        <button
          onClick={() => onSelectTab('domains')}
          className={`px-2 py-1 ${currentTab === 'domains' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Dominios
        </button>
        <button
          onClick={() => onSelectTab('lessons')}
          className={`px-2 py-1 ${currentTab === 'lessons' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Lecciones
        </button>
        <button
          onClick={() => onSelectTab('goals')}
          className={`px-2 py-1 ${currentTab === 'goals' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          Metas
        </button>
      </div>
    </header>
  );
};
