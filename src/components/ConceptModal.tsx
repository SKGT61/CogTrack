import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Folder } from 'lucide-react';
import { ConceptItem, ConceptStatus, BloomLevel, LearningDomain, ConceptFolder, ConceptMediaAttachment } from '../types/learning';
import { ConceptTableEditor } from './ConceptTableEditor';
import { MediaUploadDropzone } from './MediaUploadDropzone';
import { MediaViewerModal } from './MediaViewerModal';

interface ConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: LearningDomain;
  conceptFolders?: ConceptFolder[];
  initialFolderId?: string | null;
  conceptToEdit?: ConceptItem | null;
  isGoogleDriveSignedIn?: boolean;
  onSignInSuccess?: () => void;
  onSaveConcept: (concept: Omit<ConceptItem, 'id' | 'createdAt'>, conceptId?: string) => void;
}

export const ConceptModal: React.FC<ConceptModalProps> = ({
  isOpen,
  onClose,
  domain,
  conceptFolders = [],
  initialFolderId = null,
  conceptToEdit,
  isGoogleDriveSignedIn = false,
  onSignInSuccess,
  onSaveConcept,
}) => {
  const dbKey = domain.conceptDatabaseKey || `db-${domain.id}`;
  const relevantFolders = conceptFolders.filter(
    (f) => f.databaseKey === dbKey && f.macroDomainId === domain.macroDomainId
  );

  const [name, setName] = useState(conceptToEdit?.name || '');
  const [description, setDescription] = useState(conceptToEdit?.description || '');
  const [status, setStatus] = useState<ConceptStatus>(conceptToEdit?.status || 'a_ver');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>(conceptToEdit?.bloomLevel || 3);
  const [folderId, setFolderId] = useState<string | null>(
    conceptToEdit ? conceptToEdit.folderId || null : initialFolderId || null
  );
  const [technicalDetails, setTechnicalDetails] = useState(conceptToEdit?.technicalDetails || '');
  const [notes, setNotes] = useState(conceptToEdit?.notes || '');
  const [tableData, setTableData] = useState<Array<Record<string, string>> | null>(
    conceptToEdit?.tableData || null
  );
  const [mediaAttachments, setMediaAttachments] = useState<ConceptMediaAttachment[]>(
    conceptToEdit?.mediaAttachments || []
  );
  const [previewAttachment, setPreviewAttachment] = useState<ConceptMediaAttachment | null>(null);

  if (!isOpen) return null;

  const isMath = domain.macroDomainId === 'formal_quantitative';
  const isLanguage = domain.macroDomainId === 'linguistic_communication';
  const isTech = domain.macroDomainId === 'technological_applied';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dbName = `Base Conceptual: ${domain.name}`;

    onSaveConcept(
      {
        name: name.trim(),
        description: description.trim() || `Concepto clave de ${domain.name}`,
        macroDomainId: domain.macroDomainId,
        databaseKey: dbKey,
        databaseName: dbName,
        domainId: domain.id,
        linkedDomainIds: conceptToEdit ? conceptToEdit.linkedDomainIds : [domain.id],
        folderId: folderId || null,
        status,
        bloomLevel,
        technicalDetails: technicalDetails.trim() || undefined,
        notes: notes.trim() || undefined,
        tableData: tableData && tableData.length > 0 ? tableData : undefined,
        mediaAttachments: mediaAttachments.length > 0 ? mediaAttachments : undefined,
        updatedAt: new Date().toISOString(),
      },
      conceptToEdit?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-left my-6 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              {conceptToEdit ? 'Editar Concepto' : 'Nuevo Concepto Clave'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Concepto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isMath
                  ? 'Ej: Teorema de Stokes, Ecuación de Laplace...'
                  : isLanguage
                  ? 'Ej: Partícula に vs で, Conjugación Forma て...'
                  : isTech
                  ? 'Ej: Punteros inteligentes, Algoritmo de Dijkstra...'
                  : 'Ej: Análisis de VAN/TIR, Norma ISO 27001...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado del Concepto
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ConceptStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="a_ver">📋 Por Ver (Pendiente)</option>
                <option value="visto">👁️ Visto (En estudio)</option>
                <option value="a_reforzar">⚡ A Reforzar (Prioridad SRS)</option>
                <option value="dominado">🏆 Dominado (Masterizado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nivel Taxonomía de Bloom
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(Number(e.target.value) as BloomLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>Nivel 1 - Recordar</option>
                <option value={2}>Nivel 2 - Entender</option>
                <option value={3}>Nivel 3 - Aplicar</option>
                <option value={4}>Nivel 4 - Analizar</option>
                <option value={5}>Nivel 5 - Evaluar</option>
                <option value={6}>Nivel 6 - Crear</option>
              </select>
            </div>
          </div>

          {/* Carpeta y Subcarpeta dentro de la Base Conceptual */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                <span>Carpeta / Subcarpeta en la Base</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
            </label>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value ? e.target.value : null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">📁 (Nivel Raíz de la Base - Sin Carpeta)</option>
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción y Significado
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explicación clara del principio, regla gramatical o concepto..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                {isMath
                  ? 'Fórmula o Expresión Matemática (admite LaTeX con $..$)'
                  : isLanguage
                  ? 'Regla, Ejemplo o Patrón de Oración'
                  : isTech
                  ? 'Firma de Código, Comando o Complejidad Big-O'
                  : 'Estándar, Criterio o Fórmula Financiera'}
              </label>
              <span className="text-[10px] text-slate-500 font-normal">
                Admite renglones y saltos de línea (Enter)
              </span>
            </div>
            <textarea
              rows={3}
              value={technicalDetails}
              onChange={(e) => setTechnicalDetails(e.target.value)}
              placeholder={
                isMath
                  ? 'Ej:\n$\\int_a^b f(x) dx = F(b) - F(a)$\n$\\frac{d}{dx}[\\int_a^x f(t)dt] = f(x)$'
                  : isLanguage
                  ? 'Ej:\n[Lugar で] [Acción dinámica]\n[Destino に] [Verbo de movimiento]\n[Objeto を] [Verbo transitivo]'
                  : isTech
                  ? 'Ej:\nO(n log n) con std::sort()\nvoid quicksort(int arr[], int low, int high);'
                  : 'Ej:\nCriterio 1: VAN > 0\nCriterio 2: TIR > TMAR'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono whitespace-pre-wrap resize-y leading-relaxed"
            />
          </div>

          {/* Tabla editable de objetos JSON */}
          <ConceptTableEditor
            initialData={tableData}
            onChange={setTableData}
            isMath={isMath}
            isLanguage={isLanguage}
            isTech={isTech}
          />

          {/* Zona de Carga Multimedia en Google Drive */}
          <div className="pt-2 border-t border-slate-800">
            <MediaUploadDropzone
              attachments={mediaAttachments}
              onChangeAttachments={setMediaAttachments}
              onPreviewAttachment={(att) => setPreviewAttachment(att)}
              isGoogleDriveSignedIn={isGoogleDriveSignedIn}
              onSignInSuccess={onSignInSuccess}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas Personales o Mnemotecnia (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Consejo de estudio, advertencia de error común o mnemotecnia..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-colors cursor-pointer"
            >
              {conceptToEdit ? 'Guardar Cambios' : 'Añadir Concepto'}
            </button>
          </div>
        </form>
      </div>

      {previewAttachment && (
        <MediaViewerModal
          isOpen={Boolean(previewAttachment)}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
          conceptTitle={name}
        />
      )}
    </div>
  );
};
