import { User, Phone, Mail, MapPin, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import type { FinanceDonorV2 } from "../types";
import { money } from "./FinanceShared";

interface DonorCardProps {
  donor: FinanceDonorV2;
  ar: boolean;
  view: "grid" | "list";
  openEdit: (donor: FinanceDonorV2) => void;
  canEdit?: boolean;
}

export default function DonorCard({ donor, ar, view, openEdit, canEdit = true }: DonorCardProps) {
  const totalReceived = (donor.donations ?? [])
    .filter((d) => d.status === "RECEIVED")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPledged = (donor.donations ?? [])
    .filter((d) => d.status === "PLEDGED")
    .reduce((sum, d) => sum + d.amount, 0);

  if (view === "list") {
    return (
      <div className="ctr-card-modern list-view">
        <div className="ctr-card-header">
          <div className="ctr-card-icon-box">
            <User size={24} />
          </div>
          <div className="ctr-card-title-wrap">
            <h3 className="ctr-card-title">{donor.name}</h3>
            <span className="ctr-card-subtitle">
              {donor.donorType.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="ctr-card-status-row">
          <span className={`ctr-card-status ${!donor.isActive ? "inactive" : ""}`}>
            {donor.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
          </span>
          <span className="ctr-card-code">{donor.center?.name ?? (ar ? "عام" : "General")}</span>
        </div>

        <div className="ctr-card-stats">
          <div className="ctr-card-stat-item">
            <span className="ctr-card-stat-val text-emerald-600">{money(totalReceived, ar)}</span>
            <span className="ctr-card-stat-label">{ar ? "مستلم" : "Received"}</span>
          </div>
          <div className="ctr-card-stat-item">
            <span className="ctr-card-stat-val text-amber-600">{money(totalPledged, ar)}</span>
            <span className="ctr-card-stat-label">{ar ? "تعهد" : "Pledged"}</span>
          </div>
        </div>

        <div className="ctr-card-details">
          <div className="ctr-card-detail-row">
            <span className="ctr-card-detail-val">
              <Phone size={14} /> {donor.phone || "-"}
            </span>
          </div>
          <div className="ctr-card-detail-row">
            <span className="ctr-card-detail-val">
              <Mail size={14} /> {donor.email || "-"}
            </span>
          </div>
        </div>

        {canEdit ? (
          <div className="ctr-card-actions">
            <button
              type="button"
              className="ctr-card-btn-icon"
              onClick={() => openEdit(donor)}
              title={ar ? "تعديل" : "Edit"}
            >
              <Edit3 size={16} />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`ctr-card-modern ${!donor.isActive ? "is-inactive" : ""}`}
    >
      <div className="ctr-card-header">
        <div className="ctr-card-icon-box">
          <User size={24} />
        </div>
        <div className="ctr-card-title-wrap">
          <h3 className="ctr-card-title">{donor.name}</h3>
          <span className="ctr-card-subtitle">{donor.donorType.replace(/_/g, " ")}</span>
        </div>
      </div>

      <div className="ctr-card-status-row">
        <span className={`ctr-card-status ${!donor.isActive ? "inactive" : ""}`}>
          {donor.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
        </span>
        <span className="ctr-card-code">{donor.center?.name ?? (ar ? "عام" : "General")}</span>
      </div>

      <div className="ctr-card-stats">
        <div className="ctr-card-stat-item">
          <span className="ctr-card-stat-val text-emerald-600">{money(totalReceived, ar)}</span>
          <span className="ctr-card-stat-label">{ar ? "مستلم" : "Received"}</span>
        </div>
        <div className="ctr-card-stat-item">
          <span className="ctr-card-stat-val text-amber-600">{money(totalPledged, ar)}</span>
          <span className="ctr-card-stat-label">{ar ? "تعهد" : "Pledged"}</span>
        </div>
        <div className="ctr-card-stat-item">
          <span className="ctr-card-stat-val">{(donor.donations ?? []).length}</span>
          <span className="ctr-card-stat-label">{ar ? "عمليات" : "Ops"}</span>
        </div>
      </div>

      <div className="ctr-card-details">
        {donor.phone && (
          <div className="ctr-card-detail-row">
            <span className="ctr-card-detail-label">{ar ? "الهاتف" : "Phone"}</span>
            <span className="ctr-card-detail-val">
              <Phone size={14} className="text-emerald-500" /> {donor.phone}
            </span>
          </div>
        )}
        {donor.email && (
          <div className="ctr-card-detail-row">
            <span className="ctr-card-detail-label">{ar ? "البريد" : "Email"}</span>
            <span className="ctr-card-detail-val">
              <Mail size={14} className="text-emerald-500" /> {donor.email}
            </span>
          </div>
        )}
        {donor.address && (
          <div className="ctr-card-detail-row">
            <span className="ctr-card-detail-label">{ar ? "العنوان" : "Address"}</span>
            <span className="ctr-card-detail-val">
              <MapPin size={14} className="text-emerald-500" /> {donor.address}
            </span>
          </div>
        )}
      </div>

      {canEdit ? (
        <div className="ctr-card-actions">
          <button type="button" className="ctr-card-btn primary" onClick={() => openEdit(donor)}>
            <Edit3 size={16} />
            {ar ? "تعديل المتبرع" : "Edit Donor"}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
