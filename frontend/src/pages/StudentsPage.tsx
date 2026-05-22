import UserRolePage from "../features/users/UserRolePage";
import { labels } from "../constants/labels";

function StudentsPage() {
  return (
    <UserRolePage
      role="STUDENT"
      title={labels.users.studentsTitle}
      description={labels.users.studentsDescription}
    />
  );
}

export default StudentsPage;
