import React, { useState, useEffect, useMemo } from 'react';
import {
  Table as TableIcon,
  Code2,
  Plus,
  Trash2,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  Columns,
  ListPlus,
  Wand2,
} from 'lucide-react';

interface ConceptTableEditorProps {
  initialData?: Array<Record<string, string>> | null;
  onChange: (data: Array<Record<string, string>> | null) => void;
  isMath?: boolean;
  isLanguage?: boolean;
  isTech?: boolean;
}

export const ConceptTableEditor: React.FC<ConceptTableEditorProps> = ({
  initialData,
  onChange,
  isMath,
  isLanguage,
  isTech,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return Array.isArray(initialData) && initialData.length > 0;
  });

  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');

  // Rows of objects
  const [rows, setRows] = useState<Array<Record<string, string>>>(() => {
    if (Array.isArray(initialData) && initialData.length > 0) {
      return initialData;
    }
    return [];
  });

  // Explicit columns list to allow adding columns without rows
  const [columns, setColumns] = useState<string[]>(() => {
    if (Array.isArray(initialData) && initialData.length > 0) {
      const colSet = new Set<string>();
      initialData.forEach((row) => {
        Object.keys(row || {}).forEach((k) => colSet.add(k));
      });
      return Array.from(colSet);
    }
    return ['Propiedad', 'Valor', 'Ejemplo'];
  });

  // JSON raw text state
  const [jsonText, setJsonText] = useState<string>(() => {
    if (Array.isArray(initialData) && initialData.length > 0) {
      return JSON.stringify(initialData, null, 2);
    }
    return '';
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync to parent whenever rows change in visual mode
  const updateVisualData = (newRows: Array<Record<string, string>>, newCols?: string[]) => {
    setRows(newRows);
    if (newCols) setColumns(newCols);
    setJsonText(JSON.stringify(newRows, null, 2));
    setJsonError(null);
    onChange(newRows.length > 0 ? newRows : null);
  };

  // Initialize empty table if user turns it on
  const handleEnableTable = () => {
    setIsOpen(true);
    let defaultCols = ['Concepto', 'Descripción', 'Ejemplo'];
    let defaultRows: Array<Record<string, string>> = [];

    if (isLanguage) {
      defaultCols = ['Forma / Elemento', 'Regla de Enlace', 'Significado', 'Ejemplo'];
      defaultRows = [
        {
          'Forma / Elemento': 'う・つ・る',
          'Regla de Enlace': 'Raíz + って',
          Significado: 'Forma Te (solicitud / enlace)',
          Ejemplo: '待つ (matsu) → 待って (matte)',
        },
        {
          'Forma / Elemento': 'む・ぶ・ぬ',
          'Regla de Enlace': 'Raíz + んで',
          Significado: 'Forma Te (sonorizada)',
          Ejemplo: '飲む (nomu) → 飲んで (nonde)',
        },
      ];
    } else if (isMath) {
      defaultCols = ['Función $f(x)$', 'Derivada $f\'(x)$', 'Integral Indefinida $\\int f(x) dx$'];
      defaultRows = [
        {
          'Función $f(x)$': '$x^n$',
          'Derivada $f\'(x)$': '$n x^{n-1}$',
          'Integral Indefinida $\\int f(x) dx$': '$\\frac{x^{n+1}}{n+1} + C$',
        },
        {
          'Función $f(x)$': '$e^{ax}$',
          'Derivada $f\'(x)$': '$a e^{ax}$',
          'Integral Indefinida $\\int f(x) dx$': '$\\frac{1}{a} e^{ax} + C$',
        },
      ];
    } else if (isTech) {
      defaultCols = ['Estructura / Operación', 'Complejidad Temporal', 'Complejidad Espacial', 'Notas'];
      defaultRows = [
        {
          'Estructura / Operación': 'Búsqueda Binaria',
          'Complejidad Temporal': 'O(log n)',
          'Complejidad Espacial': 'O(1)',
          Notas: 'Requiere array ordenado previamente',
        },
        {
          'Estructura / Operación': 'Inserción en Hash Table',
          'Complejidad Temporal': 'O(1) promedio',
          'Complejidad Espacial': 'O(n)',
          Notas: 'O(n) en peor caso por colisiones',
        },
      ];
    } else {
      defaultRows = [
        { Concepto: 'Elemento A', Descripción: 'Criterio principal', Ejemplo: 'Caso práctico 1' },
      ];
    }

    setColumns(defaultCols);
    setRows(defaultRows);
    setJsonText(JSON.stringify(defaultRows, null, 2));
    onChange(defaultRows);
  };

  const handleDisableTable = () => {
    setIsOpen(false);
    setRows([]);
    setJsonText('');
    setJsonError(null);
    onChange(null);
  };

  // Add Column
  const handleAddColumn = () => {
    const baseName = `Columna_${columns.length + 1}`;
    let name = baseName;
    let counter = 1;
    while (columns.includes(name)) {
      counter++;
      name = `${baseName}_${counter}`;
    }
    const newCols = [...columns, name];
    const newRows = rows.map((r) => ({ ...r, [name]: '' }));
    updateVisualData(newRows, newCols);
  };

  // Rename Column
  const handleRenameColumn = (oldCol: string, newCol: string) => {
    const trimmed = newCol.trim();
    if (!trimmed || trimmed === oldCol) return;
    if (columns.includes(trimmed)) {
      alert('Ya existe una columna con ese nombre.');
      return;
    }

    const newCols = columns.map((c) => (c === oldCol ? trimmed : c));
    const newRows = rows.map((row) => {
      const updated: Record<string, string> = {};
      Object.keys(row).forEach((k) => {
        if (k === oldCol) {
          updated[trimmed] = row[k];
        } else {
          updated[k] = row[k];
        }
      });
      return updated;
    });

    updateVisualData(newRows, newCols);
  };

  // Delete Column
  const handleDeleteColumn = (colToDelete: string) => {
    if (columns.length <= 1) {
      alert('La tabla debe tener al menos una columna.');
      return;
    }
    const newCols = columns.filter((c) => c !== colToDelete);
    const newRows = rows.map((row) => {
      const updated = { ...row };
      delete updated[colToDelete];
      return updated;
    });
    updateVisualData(newRows, newCols);
  };

  // Add Row
  const handleAddRow = () => {
    const newRow: Record<string, string> = {};
    columns.forEach((col) => {
      newRow[col] = '';
    });
    const newRows = [...rows, newRow];
    updateVisualData(newRows);
  };

  // Delete Row
  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, idx) => idx !== index);
    updateVisualData(newRows);
  };

  // Update Cell
  const handleCellChange = (rowIndex: number, colName: string, value: string) => {
    const newRows = rows.map((r, idx) => {
      if (idx !== rowIndex) return r;
      return { ...r, [colName]: value };
    });
    updateVisualData(newRows);
  };

  // Handle JSON Textarea Change
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);

    if (!val.trim()) {
      setJsonError(null);
      setRows([]);
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        setJsonError('El JSON debe ser un Array (arreglo) de objetos, ej: [ { "clave": "valor" } ]');
        return;
      }
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          setJsonError(`El elemento en el índice [${i}] no es un objeto JSON válido.`);
          return;
        }
      }

      setJsonError(null);

      // Extract columns
      const colSet = new Set<string>();
      parsed.forEach((item: any) => {
        Object.keys(item).forEach((k) => colSet.add(k));
      });
      const detectedCols = Array.from(colSet);
      if (detectedCols.length > 0) {
        setColumns(detectedCols);
      }

      // Convert all cell values to strings safely
      const cleanRows: Array<Record<string, string>> = parsed.map((item: any) => {
        const rowObj: Record<string, string> = {};
        Object.entries(item).forEach(([k, v]) => {
          rowObj[k] = v === null || v === undefined ? '' : String(v);
        });
        return rowObj;
      });

      setRows(cleanRows);
      onChange(cleanRows);
    } catch (err: any) {
      setJsonError('Sintaxis JSON no válida. Revisa comillas dobles y comas.');
    }
  };

  // Prettify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setJsonError(null);
    } catch {
      setJsonError('No se puede formatear: el JSON contiene errores de sintaxis.');
    }
  };

  // Copy JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Presets
  const applyPreset = (presetName: 'conjugation' | 'formulas' | 'complexity' | 'truth') => {
    let presetRows: Array<Record<string, string>> = [];
    let presetCols: string[] = [];

    if (presetName === 'conjugation') {
      presetCols = ['Grupo / Terminación', 'Forma Diccionario', 'Conjugación て', 'Significado / Uso'];
      presetRows = [
        { 'Grupo / Terminación': 'う・つ・る', 'Forma Diccionario': '買う (kau)', 'Conjugación て': '買って (katte)', 'Significado / Uso': 'Comprar y...' },
        { 'Grupo / Terminación': 'む・ぶ・ぬ', 'Forma Diccionario': '飲む (nomu)', 'Conjugación て': '飲んで (nonde)', 'Significado / Uso': 'Beber y...' },
        { 'Grupo / Terminación': 'く (ku)', 'Forma Diccionario': '書く (kaku)', 'Conjugación て': '書いて (kaite)', 'Significado / Uso': 'Escribir y...' },
        { 'Grupo / Terminación': 'ぐ (gu)', 'Forma Diccionario': '泳ぐ (oyogu)', 'Conjugación て': '泳いで (oyoide)', 'Significado / Uso': 'Nadar y...' },
        { 'Grupo / Terminación': 'す (su)', 'Forma Diccionario': '話す (hanasu)', 'Conjugación て': '話して (hanashite)', 'Significado / Uso': 'Hablar y...' },
      ];
    } else if (presetName === 'formulas') {
      presetCols = ['Caso / Propiedad', 'Expresión Directa', 'Condición / Dominio', 'Resultado Teórico'];
      presetRows = [
        { 'Caso / Propiedad': 'Linealidad', 'Expresión Directa': '$\\int (af + bg) dx$', 'Condición / Dominio': '$a, b \\in \\mathbb{R}$', 'Resultado Teórico': '$a\\int f dx + b\\int g dx$' },
        { 'Caso / Propiedad': 'Por Partes', 'Expresión Directa': '$\\int u dv$', 'Condición / Dominio': '$u, v \\in C^1$', 'Resultado Teórico': '$uv - \\int v du$' },
        { 'Caso / Propiedad': 'Sustitución', 'Expresión Directa': '$\\int f(g(x))g\'(x)dx$', 'Condición / Dominio': '$u = g(x)$', 'Resultado Teórico': '$\\int f(u) du$' },
      ];
    } else if (presetName === 'complexity') {
      presetCols = ['Algoritmo', 'Mejor Caso', 'Caso Promedio', 'Peor Caso', 'Memoria Auxiliar'];
      presetRows = [
        { Algoritmo: 'QuickSort', 'Mejor Caso': 'O(n log n)', 'Caso Promedio': 'O(n log n)', 'Peor Caso': 'O(n²)', 'Memoria Auxiliar': 'O(log n)' },
        { Algoritmo: 'MergeSort', 'Mejor Caso': 'O(n log n)', 'Caso Promedio': 'O(n log n)', 'Peor Caso': 'O(n log n)', 'Memoria Auxiliar': 'O(n)' },
        { Algoritmo: 'Binary Search', 'Mejor Caso': 'O(1)', 'Caso Promedio': 'O(log n)', 'Peor Caso': 'O(log n)', 'Memoria Auxiliar': 'O(1)' },
      ];
    } else {
      presetCols = ['Entrada A', 'Entrada B', 'A AND B', 'A OR B', 'A XOR B'];
      presetRows = [
        { 'Entrada A': '0', 'Entrada B': '0', 'A AND B': '0', 'A OR B': '0', 'A XOR B': '0' },
        { 'Entrada A': '0', 'Entrada B': '1', 'A AND B': '0', 'A OR B': '1', 'A XOR B': '1' },
        { 'Entrada A': '1', 'Entrada B': '0', 'A AND B': '0', 'A OR B': '1', 'A XOR B': '1' },
        { 'Entrada A': '1', 'Entrada B': '1', 'A AND B': '1', 'A OR B': '1', 'A XOR B': '0' },
      ];
    }

    updateVisualData(presetRows, presetCols);
  };

  if (!isOpen) {
    return (
      <div className="p-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 hover:border-slate-700 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tabla de Datos (Array de Objetos JSON)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Opcional: Añade tablas de conjugaciones, fórmulas, parámetros, tablas de verdad o propiedades estructuradas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleEnableTable}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Incluir Tabla</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-3">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white">Tabla Estructurada (Array JSON)</span>
          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
            {rows.length} {rows.length === 1 ? 'objeto' : 'objetos'} · {columns.length} col
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Switch Tab Mode */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>JSON Raw</span>
            </button>
          </div>

          {/* Presets Button */}
          <div className="relative group">
            <button
              type="button"
              className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Plantillas</span>
            </button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-20">
              <button
                type="button"
                onClick={() => applyPreset('conjugation')}
                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-indigo-300 cursor-pointer"
              >
                📝 Gramática / Conjugaciones
              </button>
              <button
                type="button"
                onClick={() => applyPreset('formulas')}
                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-indigo-300 cursor-pointer"
              >
                📐 Fórmulas / Propiedades
              </button>
              <button
                type="button"
                onClick={() => applyPreset('complexity')}
                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-indigo-300 cursor-pointer"
              >
                ⚡ Complejidad Algorítmica
              </button>
              <button
                type="button"
                onClick={() => applyPreset('truth')}
                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-indigo-300 cursor-pointer"
              >
                🔲 Tabla de Verdad / Booleana
              </button>
            </div>
          </div>

          {/* Remove Table Button */}
          <button
            type="button"
            onClick={handleDisableTable}
            title="Quitar tabla de este concepto"
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Editor Mode */}
      {activeTab === 'visual' && (
        <div className="space-y-2.5">
          <div className="overflow-x-auto max-h-64 border border-slate-800/80 rounded-xl bg-slate-900/50">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                  <th className="p-2 w-8 text-center text-[10px] text-slate-500 font-mono">#</th>
                  {columns.map((col) => (
                    <th key={col} className="p-1.5 min-w-[140px] font-medium">
                      <div className="flex items-center gap-1 group/th">
                        <input
                          type="text"
                          value={col}
                          onChange={(e) => handleRenameColumn(col, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-xs text-indigo-300 font-medium focus:outline-none"
                          title="Haz clic para renombrar la clave JSON"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(col)}
                          title="Eliminar columna"
                          className="opacity-0 group-hover/th:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="p-1.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      title="Añadir nueva columna"
                      className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 2}
                      className="p-4 text-center text-xs text-slate-500 italic"
                    >
                      No hay filas en la tabla aún. Haz clic en «+ Fila» para añadir la primera.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-1.5 text-center text-[10px] text-slate-500 font-mono">
                        {rIdx + 1}
                      </td>
                      {columns.map((col) => (
                        <td key={col} className="p-1">
                          <input
                            type="text"
                            value={row[col] ?? ''}
                            onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                            placeholder="Valor..."
                            className="w-full bg-slate-950/70 border border-slate-800/80 focus:border-indigo-500 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rIdx)}
                          title="Eliminar fila"
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-indigo-400" />
                <span>+ Fila</span>
              </button>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Columns className="w-3 h-3 text-indigo-400" />
                <span>+ Columna</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500">
              Edición visual sincronizada con el modelo Array JSON.
            </span>
          </div>
        </div>
      )}

      {/* JSON Code Mode */}
      {activeTab === 'json' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Edita directamente el Array de objetos JSON:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFormatJson}
                className="px-2 py-0.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded transition flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3 h-3 text-indigo-400" />
                <span>Formatear</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-2 py-0.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded transition flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={jsonText}
            onChange={handleJsonChange}
            placeholder={`[\n  {\n    "Clave": "Valor",\n    "Ejemplo": "Detalle"\n  }\n]`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
          />

          {jsonError ? (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{jsonError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80">
              <Check className="w-3 h-3" />
              <span>Sintaxis JSON válida (Array de {rows.length} objetos)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
