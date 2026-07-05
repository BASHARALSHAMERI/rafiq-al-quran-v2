import UserRolePage from "../features/users/UserRolePage";

function FinanceTeamPage() {
  const isAr = document.documentElement.lang === "ar";
  return (
    <UserRolePage
      role="ACCOUNTANT" // default/fallback role for types if needed, or we just pass allowedRoles
      allowedRoles={["FINANCE_MANAGER", "ACCOUNTANT", "TREASURER"]}
      title={isAr ? "الفريق المالي" : "Finance Team"}
      description={isAr ? "إدارة المستخدمين الماليين (مدير مالي، محاسب، أمين صندوق)" : "Manage finance team members"}
    />
  );
}

export default FinanceTeamPage;
