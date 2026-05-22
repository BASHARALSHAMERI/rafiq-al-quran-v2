import type { ReactNode } from "react";

type PageStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

function PageState({ title, description, action }: PageStateProps) {
  return (
    <section className="page-state">
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}

export default PageState;