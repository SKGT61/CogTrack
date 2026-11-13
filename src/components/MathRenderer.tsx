import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Split text by code blocks ```...``` first
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    let segmentCounter = 0;

    // Helper to process math in normal text
    const processMathText = (text: string, baseKey: string) => {
      // Split by $$...$$ (display math) and $...$ (inline math)
      // Regex matches $$...$$ or $...$
      const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
      const subParts: React.ReactNode[] = [];
      let mIdx = 0;
      let mMatch: RegExpExecArray | null;

      while ((mMatch = mathRegex.exec(text)) !== null) {
        // Plain text before math
        if (mMatch.index > mIdx) {
          subParts.push(
            <span key={`${baseKey}-t-${mIdx}`}>{text.substring(mIdx, mMatch.index)}</span>
          );
        }

        const raw = mMatch[0];
        const isBlock = raw.startsWith('$$') && raw.endsWith('$$');
        const formula = isBlock ? raw.slice(2, -2) : raw.slice(1, -1);

        try {
          const html = katex.renderToString(formula, {
            displayMode: isBlock,
            throwOnError: false,
          });
          subParts.push(
            <span
              key={`${baseKey}-m-${mMatch.index}`}
              className={isBlock ? 'block my-2 overflow-x-auto text-indigo-300 py-1' : 'inline-block mx-0.5 text-indigo-300'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          subParts.push(
            <code key={`${baseKey}-err-${mMatch.index}`} className="font-mono text-xs text-amber-300">
              {raw}
            </code>
          );
        }

        mIdx = mathRegex.lastIndex;
      }

      if (mIdx < text.length) {
        subParts.push(
          <span key={`${baseKey}-t-tail`}>{text.substring(mIdx)}</span>
        );
      }

      return subParts;
    };

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        const textSegment = content.substring(lastIdx, match.index);
        parts.push(...processMathText(textSegment, `seg-${segmentCounter++}`));
      }

      const codeContent = match[1];
      parts.push(
        <div key={`code-${match.index}`} className="my-2.5 rounded-lg bg-slate-950 border border-slate-800 p-3 overflow-x-auto text-xs font-mono text-emerald-300">
          <pre>{codeContent}</pre>
        </div>
      );

      lastIdx = codeBlockRegex.lastIndex;
    }

    if (lastIdx < content.length) {
      parts.push(...processMathText(content.substring(lastIdx), `seg-${segmentCounter++}`));
    }

    return parts;
  }, [content]);

  return <div className={`leading-relaxed whitespace-pre-wrap ${className}`}>{renderedElements}</div>;
};
