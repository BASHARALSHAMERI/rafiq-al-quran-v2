import UserRolePage from "../features/users/UserRolePage";
import { labels } from "../constants/labels";

function CenterAdminsPage() {
  return (
    <UserRolePage
      role="CENTER_ADMIN"
      title={labels.users.centerAdminsTitle}
      description={labels.users.centerAdminsDescription}
    />
  );
}

export default CenterAdminsPage;
