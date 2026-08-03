"use client";

import React, { useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

export interface CodeHighlightProps {
  code: string;
  language?: string;
  className?: string;
  showCopy?: boolean;
}

export function CodeHighlight({
  code,
  language = "typescript",
  className,
  showCopy = true,
}: CodeHighlightProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useUIStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      addToast({ type: "success", message: "Code copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ type: "error", message: "Failed to copy code" });
    }
  };

  const getHighlightedHtml = () => {
    try {
      const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
      return hljs.highlight(code, { language: validLanguage }).value;
    } catch {
      return hljs.highlightAuto(code).value;
    }
  };

  return (
    <div className={cn("relative group rounded-lg border border-slate-200 bg-white font-mono text-xs overflow-hidden shadow-2xs", className)}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200/80 bg-slate-50 text-slate-500 text-[11px]">
        <span className="font-semibold uppercase tracking-wider">{language}</span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors p-1 rounded hover:bg-slate-200/60"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-4 overflow-x-auto text-slate-900 leading-relaxed font-mono bg-white">
        <pre className="font-mono whitespace-pre text-xs">
          <code
            className={`hljs language-${language} bg-transparent p-0 text-xs font-mono`}
            dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
          />
        </pre>
      </div>
    </div>
  );
}
