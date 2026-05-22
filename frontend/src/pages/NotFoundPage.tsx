import { Link } from "react-router-dom";
import { labels } from "../constants/labels";
import PageState from "../shared/ui/PageState";

function NotFoundPage() {
  return (
    <PageState
      title={labels.states.notFoundTitle}
      description={labels.states.notFoundDescription}
      action={<Link to="/">{labels.states.backToDashboard}</Link>}
    />
  );
}

export default NotFoundPage;
