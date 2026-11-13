import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { LearningFolder, MacroDomainInfo } from '../types/learning';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  macroDomains: MacroDomainInfo[];
  availableFolders: LearningFolder[];
  activeMacroDomainId: string;
  currentFolderId?: string | null;
  folderToEdit?: LearningFolder | null;
  onSaveFolder: (folder: Omit<LearningFolder, 'id' | 'createdAt'>, folderId?: string) => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  macroDomains,
  availableFolders,
  activeMacroDomainId,
  currentFolderId = null,
  folderToEdit,
  onSaveFolder,
}) => {
  const [name, setName] = useState(folderToEdit?.name || '');
  const [description, setDescription] = useState(folderToEdit?.description || '');
  const [macroDomainId, setMacroDomainId] = useState(
    folderToEdit?.macroDomainId || (activeMacroDomainId === 'all' ? 'formal_quantitative' : activeMacroDomainId)
  );
  const [parentFolderId, setParentFolderId] = useState<string | null>(
    folderToEdit ? folderToEdit.parentFolderId || null : currentFolderId || null
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveFolder(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        macroDomainId,
        parentFolderId: parentFolderId || null,
      },
      folderToEdit?.id
    );

    setName('');
    setDescription('');
    onClose();
  };

  // Prevent a folder from being its own parent
  const candidateParentFolders = availableFolders.filter((f) => {
    if (folderToEdit && f.id === folderToEdit.id) return false;
    return f.macroDomainId === macroDomainId;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              {folderToEdit ? 'Editar Carpeta' : 'Crear Nueva Carpeta'}
            </h3>
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
              Nombre de la Carpeta <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Japonés, Redes y Protocolos, Cálculo Superior"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ruta / Macro-Dominio
            </label>
            <select
              value={macroDomainId}
              onChange={(e) => {
                setMacroDomainId(e.target.value);
                setParentFolderId(null);
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
              Carpeta Contenedora (Para anidar carpetas dentro de otras)
            </label>
            <select
              value={parentFolderId || ''}
              onChange={(e) => setParentFolderId(e.target.value ? e.target.value : null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Raíz de la Ruta (Sin carpeta padre)</option>
              {candidateParentFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Permite crear subcarpetas jerárquicas en cualquier profundidad.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="¿Qué temas o ramas de estudio se agruparán en este espacio?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors cursor-pointer shadow"
            >
              {folderToEdit ? 'Guardar Cambios' : 'Crear Carpeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
