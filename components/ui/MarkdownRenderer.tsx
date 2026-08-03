"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeHighlight } from "./CodeHighlight";
import { cn } from "@/lib/utils";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-xs max-w-none text-slate-800 leading-relaxed font-sans", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-100 text-indigo-700 font-medium border border-slate-200/80"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-3">
                <CodeHighlight
                  code={String(children).replace(/\n$/, "")}
                  language={language || "typescript"}
                />
              </div>
            );
          },
          h1({ children }) {
            return <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-bold text-slate-900 mt-3.5 mb-1.5 pb-0.5 border-b border-slate-100">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-1">{children}</h3>;
          },
          p({ children }) {
            return <p className="mb-2.5 leading-relaxed text-slate-700">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 mb-3 pl-2 text-slate-700">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 mb-3 pl-2 text-slate-700">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-normal">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-indigo-400 bg-indigo-50/40 px-3.5 py-2 my-3 text-slate-700 italic rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-slate-100 px-3 py-2 text-left font-semibold text-slate-800">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2 text-slate-700 border-t border-slate-100">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
