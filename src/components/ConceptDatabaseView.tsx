import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Award,
  Clock,
  Trash2,
  Edit3,
  Link2,
  RefreshCw,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  MoveRight,
  Layers,
  FolderTree,
  UploadCloud,
  FileText,
  Volume2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ConceptItem,
  ConceptStatus,
  LearningDomain,
  BloomLevel,
  ConceptFolder,
  ConceptMediaAttachment,
} from '../types/learning';
import { MathRenderer } from './MathRenderer';
import { ConceptTableView } from './ConceptTableView';
import { generateConceptsLocally, getBloomName } from '../utils/pedagogicalEngine';
import { ConceptFolderModal } from './ConceptFolderModal';
import { MediaViewerModal } from './MediaViewerModal';

interface ConceptDatabaseViewProps {
  isOpen: boolean;
  onClose: () => void;
  domain: LearningDomain | null;
  concepts: ConceptItem[];
  conceptFolders: ConceptFolder[];
  allDomains: LearningDomain[];
  onAddConcept: (domain: LearningDomain, initialFolderId?: string | null) => void;
  onEditConcept: (concept: ConceptItem) => void;
  onDeleteConcept: (conceptId: string) => void;
  onChangeConceptStatus: (conceptId: string, newStatus: ConceptStatus) => void;
  onMoveConceptToFolder: (conceptId: string, targetFolderId: string | null) => void;
  onAddMultipleConcepts: (newConcepts: ConceptItem[]) => void;
  onReplaceConcepts?: (
    scope: { databaseKey: string; folderId: string | null },
    newConcepts: ConceptItem[]
  ) => void;
  onSaveConceptFolder: (
    folderData: Omit<ConceptFolder, 'id' | 'createdAt'>,
    folderId?: string
  ) => void;
  onDeleteConceptFolder: (folderId: string) => void;
}

export const ConceptDatabaseView: React.FC<ConceptDatabaseViewProps> = ({
  isOpen,
  onClose,
  domain,
  concepts,
  conceptFolders,
  allDomains,
  onAddConcept,
  onEditConcept,
  onDeleteConcept,
  onChangeConceptStatus,
  onMoveConceptToFolder,
  onAddMultipleConcepts,
  onReplaceConcepts,
  onSaveConceptFolder,
  onDeleteConceptFolder,
}) => {
  if (!isOpen || !domain) return null;

  const [activeFilter, setActiveFilter] = useState<'all' | ConceptStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'folders' | 'flat'>('folders');

  // Folder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<ConceptFolder | null>(null);
  const [parentFolderIdForNew, setParentFolderIdForNew] = useState<string | null>(null);

  // Quick move dropdown state for a concept
  const [movingConceptId, setMovingConceptId] = useState<string | null>(null);

  // Media viewer modal state
  const [selectedMediaAttachment, setSelectedMediaAttachment] = useState<ConceptMediaAttachment | null>(null);
  const [selectedConceptTitle, setSelectedConceptTitle] = useState<string>('');

  // AI Generation mode confirmation modal state (append vs replace)
  const [isAiModeModalOpen, setIsAiModeModalOpen] = useState(false);

  // Filter concepts that belong to this domain OR are in the same linked database
  // Strictly respecting the domain's macroDomainId (NO mixing across selectors)
  const dbKey = domain.conceptDatabaseKey || `db-${domain.id}`;

  const domainConcepts = useMemo(() => {
    return concepts.filter((c) => {
      if (c.macroDomainId !== domain.macroDomainId) return false;
      return (
        c.databaseKey === dbKey ||
        c.domainId === domain.id ||
        (c.linkedDomainIds && c.linkedDomainIds.includes(domain.id))
      );
    });
  }, [concepts, domain, dbKey]);

  // Conceptos en el alcance activo (carpeta actual o raíz de la base de datos)
  const scopeConcepts = useMemo(() => {
    if (currentFolderId) {
      return domainConcepts.filter((c) => c.folderId === currentFolderId);
    }
    return domainConcepts;
  }, [domainConcepts, currentFolderId]);

  // Folders belonging strictly to this database
  const relevantFolders = useMemo(() => {
    return conceptFolders.filter(
      (f) => f.databaseKey === dbKey && f.macroDomainId === domain.macroDomainId
    );
  }, [conceptFolders, dbKey, domain.macroDomainId]);

  // Current folder and ancestor trail for breadcrumbs
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return relevantFolders.find((f) => f.id === currentFolderId) || null;
  }, [relevantFolders, currentFolderId]);

  const breadcrumbs = useMemo(() => {
    const trail: ConceptFolder[] = [];
    let curr = currentFolder;
    while (curr) {
      trail.unshift(curr);
      if (!curr.parentFolderId) break;
      curr = relevantFolders.find((f) => f.id === curr?.parentFolderId) || null;
    }
    return trail;
  }, [currentFolder, relevantFolders]);

  // Direct child folders at current level
  const currentLevelFolders = useMemo(() => {
    return relevantFolders.filter(
      (f) => (f.parentFolderId || null) === (currentFolderId || null)
    );
  }, [relevantFolders, currentFolderId]);

  // Helper to count all concepts inside a folder including its nested subfolders
  const getFolderTotalConceptCount = (folderId: string): number => {
    const subfolderIds = new Set<string>([folderId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of relevantFolders) {
        if (f.parentFolderId && subfolderIds.has(f.parentFolderId) && !subfolderIds.has(f.id)) {
          subfolderIds.add(f.id);
          added = true;
        }
      }
    }
    return domainConcepts.filter((c) => c.folderId && subfolderIds.has(c.folderId)).length;
  };

  const getSubfolderCount = (folderId: string): number => {
    return relevantFolders.filter((f) => f.parentFolderId === folderId).length;
  };

  // Status counts (relative to active view: if inside folder and viewMode === 'folders', can reflect current scope or global)
  const countPorVer = domainConcepts.filter((c) => c.status === 'a_ver').length;
  const countVistos = domainConcepts.filter((c) => c.status === 'visto').length;
  const countReforzar = domainConcepts.filter((c) => c.status === 'a_reforzar').length;
  const countDominados = domainConcepts.filter((c) => c.status === 'dominado').length;

  // Filtered concepts by search, status, and folder hierarchy
  const displayedConcepts = useMemo(() => {
    return domainConcepts.filter((c) => {
      // Folder filter in folders mode (if not searching)
      if (!searchTerm.trim() && viewMode === 'folders') {
        const cFolder = c.folderId || null;
        if (cFolder !== (currentFolderId || null)) return false;
      }

      // Status filter
      if (activeFilter !== 'all' && c.status !== activeFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchDetails = c.technicalDetails?.toLowerCase().includes(q) || false;
        const matchNotes = c.notes?.toLowerCase().includes(q) || false;
        return matchName || matchDesc || matchDetails || matchNotes;
      }

      return true;
    });
  }, [domainConcepts, searchTerm, viewMode, currentFolderId, activeFilter]);

  // Identify all other themes sharing this same concept database
  const linkedThemes = allDomains.filter(
    (d) =>
      d.id !== domain.id &&
      d.macroDomainId === domain.macroDomainId &&
      (d.conceptDatabaseKey === dbKey ||
        domainConcepts.some((c) => c.linkedDomainIds && c.linkedDomainIds.includes(d.id)))
  );

  const isMath = domain.macroDomainId === 'formal_quantitative';

  const handleTriggerAiGeneration = () => {
    // Si no existe ningún concepto guardado en este ámbito, omitir la pregunta
    if (scopeConcepts.length === 0) {
      handleGenerateAI('append');
    } else {
      setIsAiModeModalOpen(true);
    }
  };

  const handleGenerateAI = async (mode: 'append' | 'replace' = 'append') => {
    setIsAiModeModalOpen(false);
    setIsGeneratingAI(true);
    const scopeLabel = currentFolder ? `en la carpeta «${currentFolder.name}»` : `en la base «${domain.name}»`;
    setAiMessage(`Consultando al tutor pedagógico para generar conceptos clave ${scopeLabel}...`);

    try {
      const res = await fetch('/api/concepts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: domain.name,
          subArea: currentFolder ? `${domain.subArea} - ${currentFolder.name}` : domain.subArea,
          macroDomainId: domain.macroDomainId,
          level: domain.level,
          topics: domain.topics,
          count: 6,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.concepts)) {
          const generated: ConceptItem[] = json.data.concepts.map((item: any, idx: number) => ({
            id: `c-ai-${domain.id}-${Date.now()}-${idx}`,
            name: item.name,
            description: item.description,
            macroDomainId: domain.macroDomainId,
            databaseKey: dbKey,
            databaseName: json.data.databaseName || `Base Conceptual: ${domain.name}`,
            domainId: domain.id,
            linkedDomainIds: [domain.id, ...linkedThemes.map((t) => t.id)],
            folderId: currentFolderId || null,
            status: item.status || 'a_ver',
            bloomLevel: (item.bloomLevel as BloomLevel) || 3,
            technicalDetails: item.technicalDetails,
            notes: item.notes,
            tableData: item.tableData || undefined,
            createdAt: new Date().toISOString().split('T')[0],
          }));

          if (mode === 'replace' && onReplaceConcepts) {
            onReplaceConcepts({ databaseKey: dbKey, folderId: currentFolderId || null }, generated);
            const targetScopeLabel = currentFolder ? `de la carpeta «${currentFolder.name}»` : 'de la base de datos';
            setAiMessage(`¡Se han reemplazado los ${scopeConcepts.length} conceptos ${targetScopeLabel} por ${generated.length} nuevos conceptos generados!`);
          } else {
            onAddMultipleConcepts(generated);
            setAiMessage(`¡Se han incorporado ${generated.length} conceptos calibrados a la base de datos!`);
          }

          setTimeout(() => setAiMessage(null), 4000);
          setIsGeneratingAI(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI concept generation error, applying pedagogical rules:', e);
    }

    // Local deterministic fallback
    const fallbackConcepts = generateConceptsLocally(domain).map((c) => ({
      ...c,
      folderId: currentFolderId || null,
    }));
    if (mode === 'replace' && onReplaceConcepts) {
      onReplaceConcepts({ databaseKey: dbKey, folderId: currentFolderId || null }, fallbackConcepts);
      const targetScopeLabel = currentFolder ? `de la carpeta «${currentFolder.name}»` : 'de la base de datos';
      setAiMessage(`¡Se han reemplazado los ${scopeConcepts.length} conceptos ${targetScopeLabel} por ${fallbackConcepts.length} conceptos basados en el temario!`);
    } else {
      onAddMultipleConcepts(fallbackConcepts);
      setAiMessage(`Se incorporaron ${fallbackConcepts.length} conceptos basados en el temario del dominio.`);
    }
    setTimeout(() => setAiMessage(null), 4000);
    setIsGeneratingAI(false);
  };

  const getStatusBadge = (status: ConceptStatus) => {
    switch (status) {
      case 'dominado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-3 h-3" /> Dominado
          </span>
        );
      case 'visto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Eye className="w-3 h-3" /> Visto
          </span>
        );
      case 'a_reforzar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> A Reforzar (SRS)
          </span>
        );
      case 'a_ver':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600">
            <Clock className="w-3 h-3" /> Por Ver
          </span>
        );
    }
  };

  const getFolderColorClass = (color?: string) => {
    switch (color) {
      case 'rose':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
      case 'amber':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'emerald':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
      case 'teal':
        return { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' };
      case 'blue':
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
      case 'purple':
        return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
      case 'slate':
        return { text: 'text-slate-300', bg: 'bg-slate-700/20', border: 'border-slate-600/30' };
      case 'indigo':
      default:
        return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' };
    }
  };

  const handleOpenAddFolder = (parentId?: string | null) => {
    setFolderToEdit(null);
    setParentFolderIdForNew(parentId !== undefined ? parentId : currentFolderId);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (folder: ConceptFolder) => {
    setFolderToEdit(folder);
    setParentFolderIdForNew(folder.parentFolderId || null);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolderWithConfirm = (folder: ConceptFolder) => {
    const conceptsInFolder = domainConcepts.filter((c) => c.folderId === folder.id).length;
    const subfolderCount = getSubfolderCount(folder.id);

    const confirmMsg = subfolderCount > 0
      ? `¿Eliminar la carpeta «${folder.name}»? Contiene ${subfolderCount} subcarpeta(s) y ${conceptsInFolder} concepto(s). Los conceptos contenidos se moverán a la raíz de la base de datos.`
      : `¿Eliminar la carpeta «${folder.name}»? Contiene ${conceptsInFolder} concepto(s). No se eliminarán los conceptos, sino que se moverán al nivel superior.`;

    if (window.confirm(confirmMsg)) {
      onDeleteConceptFolder(folder.id);
      if (currentFolderId === folder.id) {
        setCurrentFolderId(folder.parentFolderId || null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-6 p-6 shadow-2xl relative text-left flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Base de Datos Conceptual: {domain.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="font-mono text-indigo-400">{dbKey}</span>
              <span aria-hidden="true">·</span>
              {linkedThemes.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800 text-[11px]">
                  <Link2 className="w-3 h-3" /> Vinculada con: {linkedThemes.map((t) => t.name).join(', ')}
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Base exclusiva de este tema</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Folder creation button */}
            <button
              onClick={() => handleOpenAddFolder(currentFolderId)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
              title={currentFolderId ? 'Crear subcarpeta dentro de la carpeta actual' : 'Crear nueva carpeta en la raíz'}
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentFolderId ? '+ Subcarpeta' : '+ Carpeta'}</span>
            </button>

            <button
              onClick={handleTriggerAiGeneration}
              disabled={isGeneratingAI}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 disabled:opacity-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>Generar con IA</span>
            </button>

            <button
              onClick={() => onAddConcept(domain, currentFolderId)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Concepto</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Notification feedback */}
        {aiMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800 text-xs text-indigo-200 shrink-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        {/* KPI Status Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 shrink-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-800 border-indigo-500 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] text-slate-400">Total Conceptos</div>
            <div className="text-base font-bold text-white font-mono">{domainConcepts.length}</div>
          </button>

          <button
            onClick={() => setActiveFilter('a_ver')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'a_ver'
                ? 'bg-slate-800 border-indigo-500 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Por Ver
            </div>
            <div className="text-base font-bold text-slate-300 font-mono">{countPorVer}</div>
          </button>

          <button
            onClick={() => setActiveFilter('visto')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'visto'
                ? 'bg-slate-800 border-indigo-500 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] text-sky-400 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Vistos
            </div>
            <div className="text-base font-bold text-sky-300 font-mono">{countVistos}</div>
          </button>

          <button
            onClick={() => setActiveFilter('a_reforzar')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'a_reforzar'
                ? 'bg-slate-800 border-indigo-500 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> A Reforzar
            </div>
            <div className="text-base font-bold text-amber-300 font-mono">{countReforzar}</div>
          </button>

          <button
            onClick={() => setActiveFilter('dominado')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === 'dominado'
                ? 'bg-slate-800 border-indigo-500 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Award className="w-3 h-3" /> Dominados
            </div>
            <div className="text-base font-bold text-emerald-300 font-mono">{countDominados}</div>
          </button>
        </div>

        {/* Toolbar: Breadcrumb Navigation + View Mode Switcher + Search */}
        <div className="mt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex-1">
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition shrink-0 ${
                currentFolderId === null
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Raíz de la Base</span>
            </button>

            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={b.id}>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button
                    onClick={() => setCurrentFolderId(b.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition shrink-0 ${
                      isLast
                        ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate max-w-[140px]">{b.name}</span>
                  </button>
                </React.Fragment>
              );
            })}

            {currentFolder && (
              <button
                onClick={() => setCurrentFolderId(currentFolder.parentFolderId || null)}
                className="ml-auto text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition flex items-center gap-1 text-[11px] shrink-0"
                title="Subir de nivel"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Subir nivel</span>
              </button>
            )}
          </div>

          {/* Controls: Search and View Mode */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('folders')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  viewMode === 'folders'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Navegar por carpetas y subcarpetas"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Carpetas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  viewMode === 'flat'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ver lista plana de todos los conceptos"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Todos</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar concepto..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {/* FOLDERS & SUBCARPETAS SECTION (Visible in folders viewMode and when not actively filtering by search) */}
          {viewMode === 'folders' && !searchTerm.trim() && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {currentFolderId
                      ? `Subcarpetas en «${currentFolder?.name}» (${currentLevelFolders.length})`
                      : `Carpetas Principales de la Base (${currentLevelFolders.length})`}
                  </span>
                </span>
                <button
                  onClick={() => handleOpenAddFolder(currentFolderId)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>{currentFolderId ? 'Añadir subcarpeta aquí' : 'Añadir carpeta'}</span>
                </button>
              </div>

              {currentLevelFolders.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
                  <p className="text-xs text-slate-500">
                    {currentFolderId
                      ? 'No hay subcarpetas anidadas aquí. Puedes crear una con el botón «+ Subcarpeta».'
                      : 'Aún no se han creado carpetas en esta base de datos. Puedes organizarla creando tu primera carpeta.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {currentLevelFolders.map((folder) => {
                    const styling = getFolderColorClass(folder.color);
                    const subCount = getSubfolderCount(folder.id);
                    const totalConceptCount = getFolderTotalConceptCount(folder.id);

                    return (
                      <div
                        key={folder.id}
                        className={`p-3 rounded-xl border ${styling.border} ${styling.bg} hover:border-slate-600 transition flex flex-col justify-between group cursor-pointer`}
                        onClick={() => setCurrentFolderId(folder.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 ${styling.text}`}>
                              <Folder className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition">
                                {folder.name}
                              </h4>
                              {folder.description && (
                                <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
                                  {folder.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Folder Actions */}
                          <div
                            className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleOpenAddFolder(folder.id)}
                              title="Crear subcarpeta dentro de esta carpeta"
                              className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditFolder(folder)}
                              title="Editar carpeta"
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFolderWithConfirm(folder)}
                              title="Eliminar carpeta"
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Folder Badges / Stats */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300">
                              {totalConceptCount} concepto{totalConceptCount !== 1 ? 's' : ''}
                            </span>
                            {subCount > 0 && (
                              <span className="text-indigo-400">
                                · {subCount} subcarpeta{subCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-0.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                            <span>Abrir</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CONCEPTS LIST SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {searchTerm
                    ? `Resultados de búsqueda (${displayedConcepts.length})`
                    : viewMode === 'flat'
                    ? `Todos los Conceptos Registrados (${displayedConcepts.length})`
                    : currentFolder
                    ? `Conceptos en «${currentFolder.name}» (${displayedConcepts.length})`
                    : `Conceptos en la Raíz (${displayedConcepts.length})`}
                </span>
              </span>

              {viewMode === 'folders' && currentFolder && (
                <span className="text-[11px] text-indigo-400">
                  Ubicación: 📁 {breadcrumbs.map((b) => b.name).join(' / ')}
                </span>
              )}
            </div>

            {displayedConcepts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/30">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">
                  {searchTerm
                    ? 'No se encontraron conceptos para tu búsqueda.'
                    : currentFolder
                    ? `Aún no hay conceptos colocados en la carpeta «${currentFolder.name}».`
                    : 'Aún no hay conceptos registrados en esta categoría o nivel raíz.'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Puedes añadir conceptos directamente aquí con «Añadir Concepto» o generarlos con IA.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={handleTriggerAiGeneration}
                    disabled={isGeneratingAI}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar con IA</span>
                  </button>
                  <button
                    onClick={() => onAddConcept(domain, currentFolderId)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir a esta carpeta</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedConcepts.map((concept) => {
                  const assignedFolder = relevantFolders.find((f) => f.id === concept.folderId);
                  const parentOfFolder = assignedFolder?.parentFolderId
                    ? relevantFolders.find((p) => p.id === assignedFolder.parentFolderId)
                    : null;
                  const folderPath = assignedFolder
                    ? parentOfFolder
                      ? `${parentOfFolder.name} / ${assignedFolder.name}`
                      : assignedFolder.name
                    : null;

                  return (
                    <div
                      key={concept.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">{concept.name}</span>
                          {getStatusBadge(concept.status)}
                          <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/50">
                            Bloom {concept.bloomLevel}: {getBloomName(concept.bloomLevel)}
                          </span>

                          {/* Folder badge (indicates current or parent folder) */}
                          {folderPath ? (
                            <span
                              onClick={() => {
                                if (assignedFolder) setCurrentFolderId(assignedFolder.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] cursor-pointer hover:border-indigo-500 hover:text-indigo-300 transition"
                              title="Haz clic para ver la carpeta"
                            >
                              <Folder className="w-3 h-3 text-indigo-400" />
                              <span>{folderPath}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">Sin carpeta (Raíz)</span>
                          )}
                        </div>

                        {/* Actions Bar */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                          {/* Folder quick move selector */}
                          <div className="relative">
                            <select
                              value={concept.folderId || ''}
                              onChange={(e) =>
                                onMoveConceptToFolder(
                                  concept.id,
                                  e.target.value ? e.target.value : null
                                )
                              }
                              title="Mover concepto a carpeta o subcarpeta"
                              className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg px-2 py-1 text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[140px] truncate"
                            >
                              <option value="">📁 (Raíz)</option>
                              {relevantFolders.map((f) => {
                                const parent = relevantFolders.find((p) => p.id === f.parentFolderId);
                                const prefix = parent ? `↳ ${parent.name} / ` : '📁 ';
                                return (
                                  <option key={f.id} value={f.id}>
                                    {prefix}
                                    {f.name}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Status quick switcher */}
                          <select
                            value={concept.status}
                            onChange={(e) =>
                              onChangeConceptStatus(concept.id, e.target.value as ConceptStatus)
                            }
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="a_ver">Pasar a: Por Ver</option>
                            <option value="visto">Pasar a: Visto</option>
                            <option value="a_reforzar">Pasar a: A Reforzar</option>
                            <option value="dominado">Pasar a: Dominado</option>
                          </select>

                          <button
                            onClick={() => onEditConcept(concept)}
                            title="Editar concepto"
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteConcept(concept.id)}
                            title="Eliminar concepto"
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {concept.description}
                      </p>

                      {concept.technicalDetails && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed">
                          {isMath ? (
                            <MathRenderer content={concept.technicalDetails} className="whitespace-pre-wrap" />
                          ) : (
                            <span className="whitespace-pre-wrap">{concept.technicalDetails}</span>
                          )}
                        </div>
                      )}

                      {/* Tabla estructurada Array de objetos JSON */}
                      {concept.tableData && Array.isArray(concept.tableData) && concept.tableData.length > 0 && (
                        <ConceptTableView
                          data={concept.tableData}
                          title={`Tabla: ${concept.name}`}
                          isMath={isMath}
                        />
                      )}

                      {/* Archivos multimedia adjuntos (Google Drive) */}
                      {concept.mediaAttachments && concept.mediaAttachments.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Multimedia en Google Drive ({concept.mediaAttachments.length}):</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {concept.mediaAttachments.map((att) => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMediaAttachment(att);
                                  setSelectedConceptTitle(concept.name);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer group"
                                title={`Ver ${att.mediaType}: ${att.name}`}
                              >
                                {att.mediaType === 'image' ? (
                                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                                ) : att.mediaType === 'audio' ? (
                                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="font-medium max-w-[150px] truncate">{att.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono capitalize">({att.mediaType})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {concept.notes && (
                        <div className="text-[11px] text-slate-400 flex items-start gap-1">
                          <span className="text-slate-500 shrink-0">Nota:</span>
                          <span>{concept.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            {domainConcepts.length} conceptos en la base · {relevantFolders.length} carpeta(s) y subcarpeta(s)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* Concept Folder / Subfolder Modal */}
        {isFolderModalOpen && (
          <ConceptFolderModal
            isOpen={isFolderModalOpen}
            onClose={() => {
              setIsFolderModalOpen(false);
              setFolderToEdit(null);
            }}
            databaseKey={dbKey}
            databaseName={domain.name}
            macroDomainId={domain.macroDomainId}
            availableFolders={relevantFolders}
            parentFolderId={parentFolderIdForNew}
            folderToEdit={folderToEdit}
            onSaveConceptFolder={onSaveConceptFolder}
          />
        )}

        {/* Media Viewer Modal */}
        {selectedMediaAttachment && (
          <MediaViewerModal
            isOpen={Boolean(selectedMediaAttachment)}
            onClose={() => setSelectedMediaAttachment(null)}
            attachment={selectedMediaAttachment}
            conceptTitle={selectedConceptTitle}
          />
        )}

        {/* AI Concept Generation Confirmation Modal (Append vs Replace) */}
        {isAiModeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Generación de Conceptos con IA
                    </h3>
                    <p className="text-xs text-indigo-300 font-medium mt-0.5">
                      {currentFolder
                        ? `Carpeta activa: «${currentFolder.name}» · ${scopeConcepts.length} concepto(s) guardado(s)`
                        : `Base de datos: «${domain.name}» · ${scopeConcepts.length} concepto(s) guardado(s)`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModeModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Ya existen <strong className="text-white font-semibold">{scopeConcepts.length} conceptos</strong> guardados en este ámbito. ¿Deseas reemplazar los conceptos existentes o añadir los nuevos generados?
              </p>

              {/* Options */}
              <div className="space-y-3">
                {/* Option 1: Append */}
                <button
                  type="button"
                  onClick={() => handleGenerateAI('append')}
                  className="w-full text-left p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>Añadir nuevos conceptos</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                    Conserva los {scopeConcepts.length} conceptos actuales y agrega los nuevos conceptos generados por la IA al listado.
                  </p>
                </button>

                {/* Option 2: Replace */}
                <button
                  type="button"
                  onClick={() => handleGenerateAI('replace')}
                  className="w-full text-left p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                      <RefreshCw className="w-4 h-4 text-rose-400" />
                      <span>Reemplazar conceptos existentes</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Sustitución
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                    {currentFolder
                      ? `Elimina únicamente los ${scopeConcepts.length} concepto(s) dentro de la carpeta «${currentFolder.name}» y los sustituye por los nuevos generados.`
                      : `Elimina los ${scopeConcepts.length} concepto(s) de esta base de datos y los sustituye por los nuevos generados.`}
                  </p>
                </button>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsAiModeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
