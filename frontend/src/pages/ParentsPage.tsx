import UserRolePage from "../features/users/UserRolePage";
import { labels } from "../constants/labels";

function ParentsPage() {
  return (
    <UserRolePage
      role="PARENT"
      title={labels.users.parentsTitle || "أولياء الأمور"}
      description={labels.users.parentsDescription || "إدارة أولياء الأمور ومراقبة تقدم أبنائهم"}
    />
  );
}

export default ParentsPage;
