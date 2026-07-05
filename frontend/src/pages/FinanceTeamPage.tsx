import UserRolePage from "../features/users/UserRolePage";

function FinanceTeamPage() {
  const isAr = document.documentElement.lang === "ar";
  return (
    <UserRolePage
      role="ACCOUNTANT"
      allowedRoles={["FINANCE_MANAGER", "ACCOUNTANT", "TREASURER"]}
      title={isAr ? "الفريق المالي" : "Finance Team"}
      description={isAr ? "إدارة المستخدمين الماليين (مدير مالي، محاسب، أمين صندوق)" : "Manage finance team members"}
      addButtonLabel={isAr ? "إضافة مستخدم مالي" : "Add Finance User"}
    />
  );
}

export default FinanceTeamPage;
