import UserRolePage from "../features/users/UserRolePage";
import { labels } from "../constants/labels";

function SupervisorsPage() {
  return (
    <UserRolePage
      role="SUPERVISOR"
      title={labels.users.supervisorsTitle || "المشرفون"}
      description={labels.users.supervisorsDescription || "إدارة المشرفين ومتابعة أداء المعلمين"}
    />
  );
}

export default SupervisorsPage;
