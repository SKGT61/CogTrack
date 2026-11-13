import React, { useState, useMemo } from 'react';
import { Table, ChevronDown, ChevronUp, Copy, Check, Code, Eye, ExternalLink, Image as ImageIcon, Volume2, FileText } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface ConceptTableViewProps {
  data: Array<Record<string, string>>;
  title?: string;
  isMath?: boolean;
}

export const ConceptTableView: React.FC<ConceptTableViewProps> = ({
  data,
  title,
  isMath = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Extract all distinct column keys from the array of objects
  const columns = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const colSet = new Set<string>();
    data.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => colSet.add(k));
      }
    });
    return Array.from(colSet);
  }, [data]);

  if (!Array.isArray(data) || data.length === 0 || columns.length === 0) {
    return null;
  }

  const MAX_PREVIEW_ROWS = 3;
  const hasMoreRows = data.length > MAX_PREVIEW_ROWS;
  const displayedRows = isExpanded ? data : data.slice(0, MAX_PREVIEW_ROWS);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden text-xs my-2">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Table className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-[11px] text-slate-300">
            {title || 'Tabla Estructurada (Array JSON)'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-900/60">
            {data.length} {data.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            title={showJson ? 'Ver como tabla visual' : 'Ver como Array de objetos JSON'}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-[10px]"
          >
            {showJson ? <Eye className="w-3 h-3 text-indigo-400" /> : <Code className="w-3 h-3 text-indigo-400" />}
            <span>{showJson ? 'Tabla' : 'JSON'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            title="Copiar JSON al portapapeles"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {showJson ? (
        <div className="p-3 bg-slate-950 max-h-56 overflow-auto font-mono text-[11px] text-indigo-300 whitespace-pre">
          {JSON.stringify(data, null, 2)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-1.5 px-2.5 w-7 text-center font-mono text-slate-600">#</th>
                {columns.map((col) => (
                  <th key={col} className="py-1.5 px-2.5">
                    {col.includes('$') ? <MathRenderer content={col} /> : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {displayedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-600 font-mono">
                    {rIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const cellVal = row[col] ?? '';
                    const strVal = String(cellVal).trim();
                    const isUrl = /^https?:\/\//i.test(strVal);
                    const isDrive = strVal.includes('drive.google.com');
                    const isImg = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(strVal) || (isDrive && strVal.includes('view'));
                    const isAudio = /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(strVal);
                    const isPdf = /\.pdf(\?.*)?$/i.test(strVal);
                    const hasMath = typeof cellVal === 'string' && (cellVal.includes('$') || cellVal.includes('\\'));

                    if (isUrl) {
                      return (
                        <td key={col} className="py-1.5 px-2.5 text-slate-200">
                          <a
                            href={strVal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium underline-offset-2 hover:underline text-[11px]"
                            title={strVal}
                          >
                            {isImg ? (
                              <ImageIcon className="w-3 h-3 text-indigo-400" />
                            ) : isAudio ? (
                              <Volume2 className="w-3 h-3 text-emerald-400" />
                            ) : isPdf ? (
                              <FileText className="w-3 h-3 text-amber-400" />
                            ) : (
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            )}
                            <span className="truncate max-w-[120px]">
                              {isDrive ? 'Ver en Drive' : isImg ? 'Ver imagen' : isAudio ? 'Reproducir audio' : isPdf ? 'Abrir PDF' : 'Enlace'}
                            </span>
                          </a>
                        </td>
                      );
                    }

                    return (
                      <td key={col} className="py-1.5 px-2.5 text-slate-200">
                        {hasMath ? (
                          <MathRenderer content={cellVal} />
                        ) : (
                          <span className="whitespace-pre-wrap">{cellVal}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMoreRows && !showJson && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1.5 px-3 bg-slate-900/60 hover:bg-slate-900 border-t border-slate-800/80 text-[11px] text-indigo-400 hover:text-indigo-300 transition flex items-center justify-center gap-1 cursor-pointer font-medium"
        >
          {isExpanded ? (
            <>
              <span>Mostrar menos ({MAX_PREVIEW_ROWS} filas)</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Ver todas las filas ({data.length} total)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
};
