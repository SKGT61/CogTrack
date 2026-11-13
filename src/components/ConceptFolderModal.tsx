import React, { useState, useEffect } from 'react';
import { X, Folder, FolderPlus, Palette } from 'lucide-react';
import { ConceptFolder } from '../types/learning';

interface ConceptFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  databaseKey: string;
  databaseName: string;
  macroDomainId: string;
  availableFolders: ConceptFolder[];
  parentFolderId?: string | null;
  folderToEdit?: ConceptFolder | null;
  onSaveConceptFolder: (
    folderData: Omit<ConceptFolder, 'id' | 'createdAt'>,
    folderId?: string
  ) => void;
}

const FOLDER_COLORS = [
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', ring: 'ring-indigo-500' },
  { id: 'rose', label: 'Rosa / Carmín', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', ring: 'ring-rose-500' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', ring: 'ring-amber-500' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', ring: 'ring-emerald-500' },
  { id: 'teal', label: 'Turquesa', bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40', ring: 'ring-teal-500' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', ring: 'ring-blue-500' },
  { id: 'purple', label: 'Púrpura', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', ring: 'ring-purple-500' },
  { id: 'slate', label: 'Gris Neutro', bg: 'bg-slate-700/30', text: 'text-slate-300', border: 'border-slate-600/40', ring: 'ring-slate-500' },
];

export const ConceptFolderModal: React.FC<ConceptFolderModalProps> = ({
  isOpen,
  onClose,
  databaseKey,
  databaseName,
  macroDomainId,
  availableFolders,
  parentFolderId = null,
  folderToEdit,
  onSaveConceptFolder,
}) => {
  const [name, setName] = useState(folderToEdit?.name || '');
  const [description, setDescription] = useState(folderToEdit?.description || '');
  const [parentId, setParentId] = useState<string | null>(
    folderToEdit ? folderToEdit.parentFolderId || null : parentFolderId || null
  );
  const [color, setColor] = useState<string>(folderToEdit?.color || 'indigo');

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
      setDescription(folderToEdit.description || '');
      setParentId(folderToEdit.parentFolderId || null);
      setColor(folderToEdit.color || 'indigo');
    } else {
      setName('');
      setDescription('');
      setParentId(parentFolderId || null);
      setColor('indigo');
    }
  }, [folderToEdit, parentFolderId, isOpen]);

  if (!isOpen) return null;

  // Exclude current folder and its descendants to prevent circular nesting
  const validParentFolders = availableFolders.filter((f) => {
    if (!folderToEdit) return true;
    if (f.id === folderToEdit.id) return false;
    // Check if f is a descendant of folderToEdit
    let curr: ConceptFolder | undefined = f;
    while (curr && curr.parentFolderId) {
      if (curr.parentFolderId === folderToEdit.id) return false;
      curr = availableFolders.find((item) => item.id === curr?.parentFolderId);
    }
    return true;
  });

  const parentFolder = availableFolders.find((f) => f.id === parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveConceptFolder(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        databaseKey,
        macroDomainId,
        parentFolderId: parentId || null,
        color,
      },
      folderToEdit?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md my-8 p-6 shadow-2xl relative text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {folderToEdit
                  ? 'Editar Carpeta de Conceptos'
                  : parentId
                  ? 'Crear Subcarpeta de Conceptos'
                  : 'Nueva Carpeta de Conceptos'}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{databaseName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Ubicación Jerárquica (Carpeta / Subcarpeta) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ubicación Jerárquica en la Base
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">📁 (Nivel Raíz de la Base de Datos)</option>
              {validParentFolders.map((f) => {
                const parent = availableFolders.find((p) => p.id === f.parentFolderId);
                const prefix = parent ? `↳ ${parent.name} / ` : '📁 ';
                return (
                  <option key={f.id} value={f.id}>
                    {prefix}
                    {f.name}
                  </option>
                );
              })}
            </select>
            {parentFolder && (
              <p className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1">
                <span>↳ Se creará como subcarpeta anidada dentro de:</span>
                <strong className="text-white">{parentFolder.name}</strong>
              </p>
            )}
          </div>

          {/* Nombre de la Carpeta */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de la Carpeta o Subcarpeta *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Teoremas Fundamentales, Partículas (助詞), Algoritmos..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción u Objetivo de Agrupación (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Agrupa conceptos y reglas gramaticales para la interacción formal..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Color Distintivo</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                      isSelected
                        ? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring}`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${c.text.replace('text-', 'bg-')}`} />
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <Folder className="w-4 h-4" />
              <span>{folderToEdit ? 'Actualizar Carpeta' : 'Guardar Carpeta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
