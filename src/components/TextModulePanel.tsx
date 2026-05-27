"use client";

import ReactMarkdown from "react-markdown";

interface TextModulePanelProps {
  content: string;
}

export function TextModulePanel({ content }: TextModulePanelProps) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
