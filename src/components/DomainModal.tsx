import React, { useState, useMemo } from 'react';
import { X, BookOpen, Plus, Trash2, Link2, Sparkles, Database } from 'lucide-react';
import { LearningDomain, MacroDomainInfo, LearningFolder, Milestone, BloomLevel, ConceptItem } from '../types/learning';

interface DomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  macroDomains: MacroDomainInfo[];
  availableFolders: LearningFolder[];
  existingConcepts?: ConceptItem[];
  activeMacroDomainId?: string;
  activeFolderId?: string | null;
  domainToEdit?: LearningDomain | null;
  onSaveDomain: (domain: Omit<LearningDomain, 'id' | 'createdAt'>, domainId?: string) => void;
}

export const DomainModal: React.FC<DomainModalProps> = ({
  isOpen,
  onClose,
  macroDomains,
  availableFolders,
  existingConcepts = [],
  activeMacroDomainId = 'formal_quantitative',
  activeFolderId = null,
  domainToEdit,
  onSaveDomain,
}) => {
  const [name, setName] = useState(domainToEdit?.name || '');
  const [subArea, setSubArea] = useState(domainToEdit?.subArea || '');
  const [macroDomainId, setMacroDomainId] = useState<string>(
    domainToEdit?.macroDomainId || (activeMacroDomainId === 'all' ? 'formal_quantitative' : activeMacroDomainId)
  );
  const [folderId, setFolderId] = useState<string | null>(
    domainToEdit ? domainToEdit.folderId || null : activeFolderId || null
  );
  const [level, setLevel] = useState(domainToEdit?.level || 'Universitario / Profesional');
  const [description, setDescription] = useState(domainToEdit?.description || '');
  const [targetHours, setTargetHours] = useState<number>(domainToEdit?.targetHours || 80);
  const [topicsText, setTopicsText] = useState<string>(
    domainToEdit?.topics?.join(', ') || ''
  );
  const [milestonesText, setMilestonesText] = useState<string>(
    domainToEdit?.milestones?.map((m) => m.title).join('\n') || ''
  );

  // Concept Database Linking state
  // Strictly isolated to the current macroDomainId
  const existingDatabasesInMacro = useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number }>();
    existingConcepts
      .filter((c) => c.macroDomainId === macroDomainId)
      .forEach((c) => {
        if (!map.has(c.databaseKey)) {
          map.set(c.databaseKey, {
            key: c.databaseKey,
            name: c.databaseName || `Base: ${c.databaseKey}`,
            count: 1,
          });
        } else {
          map.get(c.databaseKey)!.count++;
        }
      });
    return Array.from(map.values());
  }, [existingConcepts, macroDomainId]);

  const [linkMode, setLinkMode] = useState<'new' | 'existing'>(
    domainToEdit?.conceptDatabaseKey && existingDatabasesInMacro.some(d => d.key === domainToEdit.conceptDatabaseKey)
      ? 'existing'
      : 'new'
  );

  const [selectedExistingDbKey, setSelectedExistingDbKey] = useState<string>(
    domainToEdit?.conceptDatabaseKey || (existingDatabasesInMacro[0]?.key || '')
  );

  const suggestedAffinityDb = useMemo(() => {
    if (!name.trim() || existingDatabasesInMacro.length === 0) return null;
    const lower = name.toLowerCase();
    return existingDatabasesInMacro.find((db) => {
      const dbLower = db.name.toLowerCase();
      return (
        dbLower.includes(lower) ||
        lower.includes(db.key.replace('db-', '')) ||
        (lower.includes('cálculo') && dbLower.includes('cálculo')) ||
        (lower.includes('japonés') && dbLower.includes('japonés')) ||
        (lower.includes('jlpt') && dbLower.includes('japonés')) ||
        (lower.includes('python') && dbLower.includes('programación')) ||
        (lower.includes('física') && dbLower.includes('física'))
      );
    });
  }, [name, existingDatabasesInMacro]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedTopics = topicsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const existingMilestonesMap = new Map<string, Milestone>(
      (domainToEdit?.milestones || []).map((m) => [m.title.toLowerCase().trim(), m])
    );

    const parsedMilestones: Milestone[] = milestonesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => {
        const existing = existingMilestonesMap.get(line.toLowerCase());
        if (existing) return existing;
        return {
          id: `m-${Date.now()}-${idx}`,
          title: line,
          bloomLevel: ((idx % 6) + 1) as BloomLevel,
          completed: false,
        };
      });

    // Resolved Concept Database Key:
    // If linking to existing database: use selectedExistingDbKey
    // If creating new: generate unique key based on name and timestamp
    const resolvedDbKey =
      linkMode === 'existing' && selectedExistingDbKey
        ? selectedExistingDbKey
        : domainToEdit?.conceptDatabaseKey || `db-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    onSaveDomain(
      {
        name: name.trim(),
        subArea: subArea.trim() || 'Área General',
        macroDomainId,
        folderId: folderId || null,
        conceptDatabaseKey: resolvedDbKey,
        level: level.trim() || 'Nivel General',
        description: description.trim(),
        targetHours: Number(targetHours) || 40,
        topics: parsedTopics.length > 0 ? parsedTopics : [name.trim()],
        milestones: parsedMilestones,
        resources: domainToEdit?.resources || [],
        isCustom: true,
      },
      domainToEdit?.id
    );

    onClose();
  };

  const matchingFolders = availableFolders.filter((f) => f.macroDomainId === macroDomainId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg my-8 p-6 shadow-2xl relative text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {domainToEdit ? 'Editar Dominio / Tema' : 'Nuevo Dominio de Aprendizaje'}
            </h3>
            <p className="text-xs text-slate-400">
              Configura la ruta, carpeta contenedora, nivel y temarios correspondientes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Dominio / Tema <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. JLPT N5, Robótica y Cinemática, Cálculo Vectorial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ruta / Selector Principal
              </label>
              <select
                value={macroDomainId}
                onChange={(e) => {
                  setMacroDomainId(e.target.value);
                  setFolderId(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {macroDomains.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Carpeta Contenedora
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? e.target.value : null)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Raíz de la Ruta (Sin carpeta)</option>
                {matchingFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sub-Área o Especialidad
              </label>
              <input
                type="text"
                placeholder="Ej. Kanjis y Vocabulario, Ecuaciones Diferenciales"
                value={subArea}
                onChange={(e) => setSubArea(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nivel Actual
              </label>
              <input
                type="text"
                placeholder="Ej. Principiante N5, Intermedio B2, Especializado"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Meta Total de Horas
            </label>
            <input
              type="number"
              min="5"
              max="2000"
              required
              value={targetHours}
              onChange={(e) => setTargetHours(parseInt(e.target.value) || 10)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Base de Datos Conceptual (Strictly scoped to selector) */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white">
                  Base de Datos Conceptual
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {macroDomains.find((m) => m.id === macroDomainId)?.shortLabel}
              </span>
            </div>

            {/* Affinity suggestion alert if name matches an existing database in this selector */}
            {suggestedAffinityDb && linkMode !== 'existing' && (
              <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-indigo-300 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>
                    Afinidad detectada con <strong>{suggestedAffinityDb.name}</strong> ({suggestedAffinityDb.count} conceptos).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLinkMode('existing');
                    setSelectedExistingDbKey(suggestedAffinityDb.key);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  Vincular
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="linkMode"
                  value="new"
                  checked={linkMode === 'new'}
                  onChange={() => setLinkMode('new')}
                  className="mt-0.5 text-indigo-500"
                />
                <div>
                  <span className="font-medium text-white block">
                    Generar nueva base de datos para este tema
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Crea un registro exclusivo de conceptos vistos, dominados, a reforzar y por ver para «{name || 'este tema'}».
                  </span>
                </div>
              </label>

              {existingDatabasesInMacro.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-900">
                  <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="linkMode"
                      value="existing"
                      checked={linkMode === 'existing'}
                      onChange={() => setLinkMode('existing')}
                      className="mt-0.5 text-indigo-500"
                    />
                    <div>
                      <span className="font-medium text-white block">
                        Vincular a una base conceptual existente en este selector
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Comparte el banco de conceptos sin mezclar con otros selectores.
                      </span>
                    </div>
                  </label>

                  {linkMode === 'existing' && (
                    <div className="ml-5 mt-2">
                      <select
                        value={selectedExistingDbKey}
                        onChange={(e) => setSelectedExistingDbKey(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {existingDatabasesInMacro.map((db) => (
                          <option key={db.key} value={db.key}>
                            🔗 {db.name} ({db.count} conceptos)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tópicos y Subtemas (separados por comas)
            </label>
            <input
              type="text"
              placeholder="Gramática, Kanji, Vocabulario, Comprensión auditiva"
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción y Enfoque Pedagógico
            </label>
            <textarea
              rows={2}
              placeholder="Describe los objetivos formativos, aplicaciones prácticas y criterios de dominio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hitos del Temario (uno por línea, admite LaTeX $..$)
            </label>
            <textarea
              rows={3}
              placeholder="Fase 1: Reconocimiento de conceptos base&#10;Fase 2: Resolución de problemas intermedios&#10;Fase 3: Simulacro o proyecto de integración"
              value={milestonesText}
              onChange={(e) => setMilestonesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Exclusive 4-Context Lesson Generation Notice */}
          {!domainToEdit && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Generación Exclusiva de Lecciones Semanales</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Al añadir este tema, las lecciones del plan se generarán automáticamente utilizando <strong>exclusivamente</strong> el contexto delimitado:
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono text-indigo-200">
                <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">1. Nombre del Tema</div>
                <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">2. Ruta Principal</div>
                <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">3. Sub-Área / Especialidad</div>
                <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">4. Base Conceptual</div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{domainToEdit ? 'Guardar Cambios' : 'Crear Tema y Generar Lecciones'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
