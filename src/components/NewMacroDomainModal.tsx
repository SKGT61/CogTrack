import React, { useState } from 'react';
import { X, Layers, Plus } from 'lucide-react';
import { MacroDomainInfo } from '../types/learning';

interface NewMacroDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMacroDomain: (macro: MacroDomainInfo) => void;
}

export const NewMacroDomainModal: React.FC<NewMacroDomainModalProps> = ({
  isOpen,
  onClose,
  onSaveMacroDomain,
}) => {
  const [name, setName] = useState('');
  const [shortLabel, setShortLabel] = useState('');
  const [description, setDescription] = useState('');
  const [colorScheme, setColorScheme] = useState<'indigo' | 'cyan' | 'pink' | 'emerald' | 'amber' | 'purple'>('indigo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = `macro-${Date.now()}`;
    const sLabel = shortLabel.trim() || name.trim();

    const colorConfig = {
      indigo: { accentColor: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 border-indigo-500/20', badgeText: 'text-indigo-300' },
      cyan: { accentColor: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 border-cyan-500/20', badgeText: 'text-cyan-300' },
      pink: { accentColor: 'text-pink-400', badgeBg: 'bg-pink-500/10 border-pink-500/20', badgeText: 'text-pink-300' },
      emerald: { accentColor: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20', badgeText: 'text-emerald-300' },
      amber: { accentColor: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20', badgeText: 'text-amber-300' },
      purple: { accentColor: 'text-purple-400', badgeBg: 'bg-purple-500/10 border-purple-500/20', badgeText: 'text-purple-300' },
    }[colorScheme];

    onSaveMacroDomain({
      id,
      name: name.trim(),
      shortLabel: sLabel,
      description: description.trim() || 'Ruta personalizada de aprendizaje interdisciplinario.',
      accentColor: colorConfig.accentColor,
      badgeBg: colorConfig.badgeBg,
      badgeText: colorConfig.badgeText,
      isCustom: true,
    });

    setName('');
    setShortLabel('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Nuevo Selector de Ruta</h3>
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
              Nombre de la Macro-Ruta <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Artes, Diseño y Creatividad"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!shortLabel) setShortLabel(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Etiqueta del Selector (pestaña)
            </label>
            <input
              type="text"
              placeholder="Ej. Artes y Diseño"
              value={shortLabel}
              onChange={(e) => setShortLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción (aparecerá bajo el selector) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe los temas, disciplinas y enfoque que abarcará esta macro-ruta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Esquema de Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[
                { id: 'indigo', bg: 'bg-indigo-500' },
                { id: 'cyan', bg: 'bg-cyan-500' },
                { id: 'pink', bg: 'bg-pink-500' },
                { id: 'emerald', bg: 'bg-emerald-500' },
                { id: 'amber', bg: 'bg-amber-500' },
                { id: 'purple', bg: 'bg-purple-500' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorScheme(c.id as any)}
                  className={`h-8 rounded-lg border-2 transition-transform cursor-pointer ${c.bg} ${
                    colorScheme === c.id ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
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
              Crear Selector
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
