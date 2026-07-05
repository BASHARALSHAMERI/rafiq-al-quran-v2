/**
 * Admin Layout V3 Premium - Islamic Elegance
   *التخطيط الإداري 
 */

import { Outlet } from "react-router-dom";
import { PageScaffold } from "../components/layout/PageScaffold";
import { SidebarPremium } from "../components/layout/SidebarPremium";
import { TopbarPremium } from "../components/layout/TopbarPremium";
import { useI18n } from "./i18n";

function AdminLayout() {
  const { direction } = useI18n();

  return (
    <div className="admin-layout" dir={direction}>
      {/* Ambient Background Effects */}
      <div className="bg-ambient-glow" />
      
      {/* Sidebar */}
      <SidebarPremium />

      {/* Topbar */}
      <TopbarPremium />

      {/* Main Content */}
      <main className="main-content">
        <PageScaffold>
          <Outlet />
        </PageScaffold>
      </main>
    </div>
  );
}

export default AdminLayout;
