import UserRolePage from "../features/users/UserRolePage";
import { labels } from "../constants/labels";

function TeachersPage() {
  return (
    <UserRolePage
      role="TEACHER"
      title={labels.users.teachersTitle}
      description={labels.users.teachersDescription}
    />
  );
}

export default TeachersPage;
