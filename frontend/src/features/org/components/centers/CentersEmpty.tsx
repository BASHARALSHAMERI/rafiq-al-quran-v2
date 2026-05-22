import React from "react";

interface CtrEmptyProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  action?: React.ReactNode;
}

export function CtrEmpty({ icon: Icon, title, desc, action }: CtrEmptyProps) {
  return (
    <div className="ctr-empty">
      <div className="ctr-empty__icon-wrapper">
        <Icon className="w-10 h-10" />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action && <div className="ctr-empty__action">{action}</div>}
    </div>
  );
}
