import UserRolePage from "../features/users/UserRolePage";

function AccountantsPage() {
  const isAr = document.documentElement.lang === "ar";
  return (
    <UserRolePage
      role="ACCOUNTANT"
      title={isAr ? "إدارة المحاسبين" : "Accountants"}
      description={isAr ? "إدارة بيانات المحاسبين" : "Manage accountant records"}
    />
  );
}

export default AccountantsPage;
