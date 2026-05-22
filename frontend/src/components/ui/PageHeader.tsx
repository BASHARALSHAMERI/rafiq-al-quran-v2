/**
 * ═════════════════════════════════════════════════════════════════
 * PAGE HEADER — Unified SaaS Standard
 * رأس صفحة موحد — معيار SaaS احترافي
 * ═════════════════════════════════════════════════════════════════
 *
 * Reference: AuditPage aud-top pattern
 * ┌──────────────────────────────────────────────────────────┐
 * │  🔔 العنوان                        [زر 1] [زر 2]       │
 * │  وصف بسيط ومفيد                                        │
 * └──────────────────────────────────────────────────────────┘
 *
 * Rules:
 * - No breadcrumbs
 * - Icon is INLINE with title (no decorative boxes)
 * - Short, useful description
 * - Max 2–3 action buttons
 * - Title + actions share the same row
 */

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, description, actions, icon }: PageHeaderProps) {
  return (
    <motion.header
      className="page-header-unified"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="page-header-row">
        <div className="page-header-text">
          <h1 className="page-header-title">
            {icon && <span className="page-header-icon-inline">{icon}</span>}
            {title}
          </h1>
          {description && (
            <p className="page-header-sub">{description}</p>
          )}
        </div>

        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}
      </div>
    </motion.header>
  );
}

export default PageHeader;
