"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface GraphicModulePanelProps {
  content: string;
}

export function GraphicModulePanel({ content }: GraphicModulePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isMermaid = content.trim().startsWith("graph") ||
      content.trim().startsWith("flowchart") ||
      content.trim().startsWith("sequenceDiagram");

    if (isMermaid) {
      import("mermaid").then((mermaid) => {
        mermaid.default.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#1A237E",
            primaryTextColor: "#FFFDF9",
            lineColor: "#D4AF37",
            secondaryColor: "#F5F0E8",
          },
        });
        const id = `mermaid-${Date.now()}`;
        containerRef.current!.innerHTML = `<div class="mermaid" id="${id}">${content}</div>`;
        mermaid.default.run({ nodes: [containerRef.current!.querySelector(".mermaid")!] });
      });
    }
  }, [content]);

  const isSvg = content.trim().startsWith("<svg");
  if (isSvg) {
    const sanitized = DOMPurify.sanitize(content, { USE_PROFILES: { svg: true } });
    return (
      <div
        className="flex justify-center items-center w-full overflow-auto"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return <div ref={containerRef} className="w-full flex justify-center" />;
}
