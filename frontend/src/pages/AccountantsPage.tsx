import UserRolePage from "../features/users/UserRolePage";

function AccountantsPage() {
  return (
    <UserRolePage
      role="ACCOUNTANT"
      description={
        document.documentElement.lang === "ar"
          ? "إدارة بيانات المحاسبين"
          : "Manage accountant accounts"
      }
    />
  );
}

export default AccountantsPage;
