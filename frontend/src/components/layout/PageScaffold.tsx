import type { ReactNode } from "react";

type PageScaffoldWidth = "default" | "wide" | "full";

interface PageScaffoldProps {
  children: ReactNode;
  className?: string;
  width?: PageScaffoldWidth;
}

export function PageScaffold({
  children,
  className = "",
  width = "default"
}: PageScaffoldProps) {
  return (
    <div className={["page-scaffold", `page-scaffold--${width}`, className].filter(Boolean).join(" ")}>
      <div className="page-scaffold__viewport">{children}</div>
    </div>
  );
}

export default PageScaffold;
