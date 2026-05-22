import { Link } from "react-router-dom";
import { labels } from "../constants/labels";
import PageState from "../shared/ui/PageState";

function ForbiddenPage() {
  return (
    <PageState
      title={labels.states.forbiddenTitle}
      description={labels.states.forbiddenDescription}
      action={<Link to="/">{labels.states.backToDashboard}</Link>}
    />
  );
}

export default ForbiddenPage;
