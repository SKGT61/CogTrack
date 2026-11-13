import React, { useState } from 'react';
import {
  BookOpen,
  Sigma,
  Cpu,
  Plus,
  CheckSquare,
  Square,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  Bookmark,
  Trash2,
  Edit3,
  Calendar,
  Zap,
  Play,
  Layers,
  Sparkles,
  Folder,
  FolderPlus,
  FolderOpen,
  ArrowLeft,
  Home,
} from 'lucide-react';
import {
  LearningDomain,
  LearningFolder,
  DailyStudyLog,
  MacroDomainInfo,
  ConceptItem,
} from '../types/learning';
import { getDomainStats } from '../utils/analytics';
import { MathRenderer } from './MathRenderer';

interface DomainsViewProps {
  domains: LearningDomain[];
  folders: LearningFolder[];
  macroDomains: MacroDomainInfo[];
  concepts: ConceptItem[];
  logs: DailyStudyLog[];
  onAddDomain: (macroDomainId?: string, folderId?: string | null) => void;
  onEditDomain: (domain: LearningDomain) => void;
  onDeleteDomain: (domainId: string) => void;
  onAddFolder: (macroDomainId: string, parentFolderId?: string | null) => void;
  onEditFolder: (folder: LearningFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  onOpenNewMacroDomainModal: () => void;
  onToggleMilestone: (domainId: string, milestoneId: string) => void;
  onAddMilestone: (domainId: string, title: string) => void;
  onStartPedagogicalSession: (domain: LearningDomain) => void;
  onOpenWeeklyPlan: (domain: LearningDomain) => void;
  onOpenLessonsHub?: (domain: LearningDomain) => void;
  onOpenConceptDatabase: (domain: LearningDomain) => void;
  onQuickLog: (domainId: string) => void;
}

export const DomainsView: React.FC<DomainsViewProps> = ({
  domains,
  folders,
  macroDomains,
  concepts,
  logs,
  onAddDomain,
  onEditDomain,
  onDeleteDomain,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onOpenNewMacroDomainModal,
  onToggleMilestone,
  onAddMilestone,
  onStartPedagogicalSession,
  onOpenWeeklyPlan,
  onOpenLessonsHub,
  onOpenConceptDatabase,
  onQuickLog,
}) => {
  const [selectedMacroFilter, setSelectedMacroFilter] = useState<string>(
    macroDomains[0]?.id || 'formal_quantitative'
  );

  // Active folder navigation path (for nested folders)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);
  const [newMilestoneInput, setNewMilestoneInput] = useState<{ [key: string]: string }>({});

  const currentMacroInfo = macroDomains.find((m) => m.id === selectedMacroFilter);

  // Find the active folder if any
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  // Build folder hierarchy breadcrumb trail
  const getBreadcrumbTrail = (): LearningFolder[] => {
    if (!currentFolderId) return [];
    const trail: LearningFolder[] = [];
    let cur: LearningFolder | undefined = currentFolder;
    while (cur) {
      trail.unshift(cur);
      cur = folders.find((f) => f.id === cur?.parentFolderId);
    }
    return trail;
  };

  const breadcrumbs = getBreadcrumbTrail();

  // Reset folder navigation when macro selector changes
  const handleSelectMacro = (macroId: string) => {
    setSelectedMacroFilter(macroId);
    setCurrentFolderId(null);
  };

  // Filter folders at the current view level
  const foldersAtCurrentLevel = folders.filter((f) => {
    if (selectedMacroFilter !== 'all' && f.macroDomainId !== selectedMacroFilter) return false;
    return (f.parentFolderId || null) === (currentFolderId || null);
  });

  // Filter domains at the current view level
  const domainsAtCurrentLevel = domains.filter((d) => {
    if (selectedMacroFilter !== 'all' && d.macroDomainId !== selectedMacroFilter) return false;
    return (d.folderId || null) === (currentFolderId || null);
  });

  // Helper to count total domains inside a folder (including recursive subfolders)
  const countDomainsInFolder = (folderId: string): number => {
    let count = domains.filter((d) => d.folderId === folderId).length;
    const subfolders = folders.filter((f) => f.parentFolderId === folderId);
    subfolders.forEach((sub) => {
      count += countDomainsInFolder(sub.id);
    });
    return count;
  };

  const getMacroIcon = (macroId: string) => {
    switch (macroId) {
      case 'formal_quantitative':
        return <Sigma className="w-4 h-4 text-violet-400" />;
      case 'linguistic_communication':
        return <BookOpen className="w-4 h-4 text-sky-400" />;
      case 'technological_applied':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'conceptual_normative_social':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'custom':
        return <Sparkles className="w-4 h-4 text-rose-400" />;
      default:
        return <Bookmark className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleAddMilestoneSubmit = (domainId: string) => {
    const text = newMilestoneInput[domainId]?.trim();
    if (!text) return;
    onAddMilestone(domainId, text);
    setNewMilestoneInput((prev) => ({ ...prev, [domainId]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Selector Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Rutas de Aprendizaje</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explora y organiza tus áreas de conocimiento mediante carpetas, temarios e hitos estructurados.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenNewMacroDomainModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              title="Añadir un nuevo selector / macro-ruta personalizada"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nuevo Selector</span>
            </button>

            <button
              onClick={() => onAddFolder(selectedMacroFilter === 'all' ? 'formal_quantitative' : selectedMacroFilter, currentFolderId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              title="Crear carpeta para agrupar varios temas o subcarpetas"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentFolderId ? 'Nueva Subcarpeta' : 'Nueva Carpeta'}</span>
            </button>

            <button
              onClick={() => onAddDomain(selectedMacroFilter === 'all' ? 'formal_quantitative' : selectedMacroFilter, currentFolderId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Tema</span>
            </button>
          </div>
        </div>

        {/* Selectors Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => handleSelectMacro('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedMacroFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas las Rutas ({domains.length})
          </button>

          {macroDomains.map((macro) => {
            const count = domains.filter((d) => d.macroDomainId === macro.id).length;
            const isSelected = selectedMacroFilter === macro.id;
            return (
              <button
                key={macro.id}
                onClick={() => handleSelectMacro(macro.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {getMacroIcon(macro.id)}
                <span>{macro.shortLabel}</span>
                <span className="text-[10px] text-slate-500 font-mono tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Small Description Under the Selector */}
        {currentMacroInfo && selectedMacroFilter !== 'all' && (
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
              {getMacroIcon(currentMacroInfo.id)}
            </div>
            <div>
              <span className="font-semibold text-white block mb-0.5">
                {currentMacroInfo.name}
              </span>
              <p className="text-slate-400 text-xs">{currentMacroInfo.description}</p>
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation when inside Folders */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 flex-wrap">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
            >
              <Home className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentMacroInfo?.shortLabel || 'Inicio'}</span>
            </button>

            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={b.id}>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button
                    disabled={isLast}
                    onClick={() => setCurrentFolderId(b.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      isLast
                        ? 'text-white font-semibold cursor-default'
                        : 'text-slate-400 hover:text-white cursor-pointer'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>{b.name}</span>
                  </button>
                </React.Fragment>
              );
            })}

            <button
              onClick={() => {
                const prev = breadcrumbs[breadcrumbs.length - 2];
                setCurrentFolderId(prev ? prev.id : null);
              }}
              className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Volver arriba</span>
            </button>
          </div>
        )}
      </div>

      {/* FOLDERS GRID AT CURRENT LEVEL */}
      {foldersAtCurrentLevel.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Folder className="w-4 h-4 text-amber-400" />
              <span>Carpetas de Agrupación ({foldersAtCurrentLevel.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {foldersAtCurrentLevel.map((folder) => {
              const totalInside = countDomainsInFolder(folder.id);
              const subCount = folders.filter((f) => f.parentFolderId === folder.id).length;

              return (
                <div
                  key={folder.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-slate-200 text-sm">{folder.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditFolder(folder)}
                          className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer rounded"
                          title="Editar carpeta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFolder(folder.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded"
                          title="Eliminar carpeta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {folder.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {folder.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {totalInside} tema{totalInside !== 1 ? 's' : ''}
                      {subCount > 0 && ` · ${subCount} subcarpeta${subCount !== 1 ? 's' : ''}`}
                    </span>

                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Abrir carpeta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DOMAINS LIST AT CURRENT LEVEL */}
      <div className="space-y-4">
        {domainsAtCurrentLevel.length === 0 && foldersAtCurrentLevel.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl p-6">
            <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Esta carpeta o ruta no contiene temas aún.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => onAddFolder(selectedMacroFilter === 'all' ? 'formal_quantitative' : selectedMacroFilter, currentFolderId)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Crear Carpeta</span>
              </button>
              <button
                onClick={() => onAddDomain(selectedMacroFilter === 'all' ? 'formal_quantitative' : selectedMacroFilter, currentFolderId)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-400 hover:bg-indigo-300 text-slate-950 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Tema / Dominio</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {domainsAtCurrentLevel.map((domain) => {
              const stats = getDomainStats(domain, logs);
              const isExpanded = expandedDomainId === domain.id;

              const dbKey = domain.conceptDatabaseKey || `db-${domain.id}`;
              const domainConcepts = concepts.filter((c) => {
                if (c.macroDomainId !== domain.macroDomainId) return false;
                return (
                  c.databaseKey === dbKey ||
                  c.domainId === domain.id ||
                  (c.linkedDomainIds && c.linkedDomainIds.includes(domain.id))
                );
              });

              const countPorVer = domainConcepts.filter((c) => c.status === 'a_ver').length;
              const countVistos = domainConcepts.filter((c) => c.status === 'visto').length;
              const countReforzar = domainConcepts.filter((c) => c.status === 'a_reforzar').length;
              const countDominados = domainConcepts.filter((c) => c.status === 'dominado').length;

              return (
                <div
                  key={domain.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden transition-colors hover:border-slate-700"
                >
                  {/* Card Header & Summary */}
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          <div className="flex items-center gap-1.5 font-medium text-indigo-400">
                            {getMacroIcon(domain.macroDomainId)}
                            <span>
                              {macroDomains.find((m) => m.id === domain.macroDomainId)?.shortLabel || 'Ruta'}
                            </span>
                          </div>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-300 font-medium">{domain.subArea}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400">{domain.level}</span>
                          {stats.lastStudiedDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Último estudio: <strong className="font-mono tabular-nums text-slate-300">{stats.lastStudiedDate}</strong></span>
                            </>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white">
                          {domain.name}
                        </h4>

                        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                          {domain.description}
                        </p>

                        {/* Topics badges */}
                        <div className="pt-1 flex items-center gap-2 flex-wrap text-xs text-slate-400">
                          <span className="text-slate-500 font-medium">Tópicos:</span>
                          {domain.topics.map((top, tIdx) => (
                            <span key={tIdx} className="inline-flex items-center">
                              <span className="text-slate-300">{top}</span>
                              {tIdx < domain.topics.length - 1 && <span className="ml-2 text-slate-700">·</span>}
                            </span>
                          ))}
                        </div>

                        {/* Concept Database Quick Strip */}
                        <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onOpenConceptDatabase(domain)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/80 hover:bg-indigo-900/80 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Base Conceptual ({domainConcepts.length})</span>
                          </button>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                            📋 Por ver: <strong>{countPorVer}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-sky-950/60 text-sky-300 border border-sky-800/60">
                            👁️ Vistos: <strong>{countVistos}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-950/60 text-amber-300 border border-amber-800/60">
                            ⚡ A reforzar: <strong>{countReforzar}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                            🏆 Dominados: <strong>{countDominados}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Metrics & High Performance Session Launchers */}
                      <div className="flex flex-wrap items-center gap-4 lg:gap-5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                        {/* Hours progress */}
                        <div className="text-left lg:text-right">
                          <div className="flex items-baseline gap-1 lg:justify-end">
                            <span className="text-lg font-bold text-white font-mono tabular-nums">
                              {stats.totalHours}h
                            </span>
                            <span className="text-xs text-slate-400">/ {domain.targetHours}h</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {stats.progressPercent}% de la meta
                          </div>
                        </div>

                        {/* Milestones count */}
                        <div className="text-left lg:text-right pl-3 lg:border-l border-slate-800">
                          <div className="text-sm font-semibold text-slate-200 font-mono tabular-nums">
                            {stats.completedMilestones} / {stats.totalMilestones}
                          </div>
                          <div className="text-[11px] text-slate-500">hitos verificados</div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onStartPedagogicalSession(domain)}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow"
                            title="Iniciar sesión de 3 fases: Warm-up (3m) -> Examen (10-15m) -> Métricas (2m)"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Sesión de Alto Rendimiento</span>
                          </button>

                          <button
                            onClick={() => (onOpenLessonsHub ? onOpenLessonsHub(domain) : onOpenWeeklyPlan(domain))}
                            className="px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                            title="Abrir centro de Lecciones: Niveles de Dificultad o Plan Semanal Bloom"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Lecciones</span>
                          </button>

                          <button
                            onClick={() => onOpenConceptDatabase(domain)}
                            className="px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                            title="Abrir base de datos de conceptos clave (vistos, dominados, a reforzar y por ver)"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Conceptos</span>
                          </button>

                          <button
                            onClick={() => setExpandedDomainId(isExpanded ? null : domain.id)}
                            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                            title={isExpanded ? 'Contraer temario' : 'Ver temario, hitos y bibliografía'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${stats.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Collapsible Syllabus & Resources */}
                  {isExpanded && (
                    <div className="bg-slate-950/60 border-t border-slate-800/80 p-5 space-y-4">
                      {/* Milestones Checklist */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-semibold text-slate-300">
                            Hitos del Temario ({stats.completedMilestones} de {stats.totalMilestones} completados)
                          </span>
                        </div>

                        <div className="space-y-2">
                          {domain.milestones.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => onToggleMilestone(domain.id, m.id)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                                m.completed
                                  ? 'bg-slate-900/50 border-slate-800/60 text-slate-400 line-through'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <button
                                type="button"
                                className="mt-0.5 text-slate-400 hover:text-indigo-400 shrink-0 cursor-pointer"
                              >
                                {m.completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500" />
                                )}
                              </button>
                              <div className="leading-snug flex-1">
                                <MathRenderer content={m.title} />
                              </div>
                              {m.bloomLevel && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900/60 shrink-0">
                                  Bloom N{m.bloomLevel}
                                </span>
                              )}
                              {m.isExtended && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-900/60 shrink-0">
                                  Extendido
                                </span>
                              )}
                              {m.completedAt && (
                                <span className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
                                  {m.completedAt}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Quick Add Milestone */}
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Añadir nuevo hito o tema de estudio (admite LaTeX con $..$)..."
                            value={newMilestoneInput[domain.id] || ''}
                            onChange={(e) =>
                              setNewMilestoneInput({ ...newMilestoneInput, [domain.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddMilestoneSubmit(domain.id);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleAddMilestoneSubmit(domain.id)}
                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Añadir
                          </button>
                        </div>
                      </div>

                      {/* Curated Resources */}
                      {domain.resources.length > 0 && (
                        <div className="pt-3 border-t border-slate-800/80">
                          <span className="text-xs font-semibold text-slate-400 block mb-2">
                            Material de Referencia & Bibliografía
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {domain.resources.map((res) => (
                              <div
                                key={res.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300"
                              >
                                <span className="text-[11px] text-slate-500 uppercase font-mono">
                                  {res.type === 'book' ? 'Libro' : res.type === 'course' ? 'Curso' : 'Banco'}
                                </span>
                                <span aria-hidden="true" className="text-slate-700">·</span>
                                <span>{res.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions footer */}
                      <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-800/80">
                        <button
                          onClick={() => onQuickLog(domain.id)}
                          className="px-2.5 py-1 text-indigo-400 hover:text-indigo-300 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Registrar Sesión Manualmente</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditDomain(domain)}
                            className="px-2.5 py-1 text-slate-400 hover:text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => onDeleteDomain(domain.id)}
                            className="px-2.5 py-1 text-rose-400 hover:text-rose-300 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
