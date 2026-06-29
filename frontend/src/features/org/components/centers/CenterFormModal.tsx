import React, { useCallback, useMemo, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  Briefcase,
  CalendarClock,
  ImagePlus,
  UserPlus,
  Users,
  MapPin
} from "lucide-react";

import type { CenterGender } from "../../../org/types";
import CircleScheduleEditor from "../../CircleScheduleEditor";
import { Button } from "../../../../components/ui/Button";
import ImageUploadField from "../../../../components/ui/ImageUploadField";
import Modal from "../../../../components/ui/Modal";
import type { FormMode, CenterDraft, QuickRole } from "./centers.types";
import { notifyError } from "../../../../shared/ui/feedback";

interface CenterFormModalProps {
  isOpen: boolean;
  mode: FormMode;
  draft: CenterDraft;
  setDraft: React.Dispatch<React.SetStateAction<CenterDraft>>;
  pending: boolean;
  ar: boolean;
  canManage: boolean;
  adminOpts: { id: number; label: string }[];
  supOpts: { id: number; label: string }[];
  onClose: () => void;
  onSubmit: () => void;
  onOpenQuick: (r: QuickRole) => void;
}

const copyByLanguage = {
  ar: {
    modalTitleCreate: "\u0625\u0646\u0634\u0627\u0621 \u0645\u0631\u0643\u0632 \u062c\u062f\u064a\u062f",
    modalTitleEdit: "\u062a\u0639\u062f\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0632",
    overviewEyebrow: "\u0645\u0633\u0627\u062d\u0629 \u0625\u062f\u0627\u0631\u064a\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629",
    overviewTitle: "\u062a\u062c\u0647\u064a\u0632 \u0645\u0631\u0643\u0632 \u0628\u0628\u0646\u064a\u0629 \u0648\u0627\u0636\u062d\u0629 \u0648\u0647\u0648\u064a\u0629 \u0645\u0624\u0633\u0633\u064a\u0629",
    overviewText:
      "\u064a\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0628\u0646\u0641\u0633 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u062d\u0627\u0644\u064a\u064b\u0627 \u0628\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0646\u0638\u0627\u0645\u060c \u0645\u0639 \u0639\u0631\u0636 \u062a\u0646\u0638\u064a\u0645\u064a \u0623\u0648\u0636\u062d \u0644\u0644\u0641\u0631\u0642 \u0627\u0644\u0645\u0624\u0633\u0633\u064a\u0629.",
    statMode: "\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0629",
    statModeCreate: "\u0625\u0646\u0634\u0627\u0621",
    statModeEdit: "\u062a\u062d\u062f\u064a\u062b",
    statAdmin: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629",
    statAdminAssigned: "\u0645\u0639\u064a\u0646",
    statAdminMissing: "\u0642\u064a\u062f \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631",
    statSupervisors: "\u0627\u0644\u0645\u0634\u0631\u0641\u0648\u0646",
    statSupervisorsValue: "\u0645\u0634\u0631\u0641",
    identityTitle: "\u0647\u0648\u064a\u0629 \u0627\u0644\u0645\u0631\u0643\u0632",
    identityHint:
      "\u0623\u062f\u062e\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629 \u0628\u0635\u064a\u0627\u063a\u0629 \u0648\u0627\u0636\u062d\u0629.",
    nameLabel: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632 (\u0639\u0631\u0628\u064a) *",
    namePlaceholder: "\u0645\u062b\u0627\u0644: \u0645\u0631\u0643\u0632 \u0627\u0644\u0641\u0631\u0642\u0627\u0646 \u0644\u062a\u062d\u0641\u064a\u0638 \u0627\u0644\u0642\u0631\u0622\u0646",
    nameHelper: "\u064a\u0638\u0647\u0631 \u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632 \u0641\u064a \u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631.",
    mosqueLabel: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062c\u062f \u0623\u0648 \u0627\u0644\u0645\u0648\u0642\u0639",
    mosquePlaceholder: "\u0645\u062b\u0627\u0644: \u0645\u0633\u062c\u062f \u0627\u0644\u0647\u062f\u0649 \u2014 \u062d\u064a \u0627\u0644\u0646\u0648\u0631",
    mosqueHelper: "\u0645\u0639\u0644\u0648\u0645\u0629 \u062a\u0638\u0647\u0631 \u0644\u0644\u0627\u0633\u062a\u062f\u0644\u0627\u0644 \u0648\u0627\u0644\u062a\u0645\u064a\u064a\u0632 \u0628\u064a\u0646 \u0627\u0644\u0645\u0631\u0627\u0643\u0632.",
    genderLabel: "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629 *",
    genderPlaceholder: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0626\u0629",
    genderMale: "\u0627\u0644\u0630\u0643\u0648\u0631 \u0641\u0642\u0637",
    genderFemale: "\u0627\u0644\u0625\u0646\u0627\u062b \u0641\u0642\u0637",
    genderHelper: "\u064a\u0624\u062b\u0631 \u0647\u0630\u0627 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0639\u0644\u0649 \u0627\u0644\u0639\u0631\u0636 \u0648\u0627\u0644\u0625\u0644\u062d\u0627\u0642.",
    governanceTitle: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0648\u0627\u0644\u062d\u0648\u0643\u0645\u0629",
    governanceHint:
      "\u062d\u062f\u0651\u062f \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0623\u0648\u0644 \u0648\u0627\u0644\u0625\u0633\u0646\u0627\u062f \u0627\u0644\u0625\u0634\u0631\u0627\u0641\u064a \u0628\u0634\u0643\u0644 \u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0648\u0633\u0639.",
    adminLabel: "\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0631\u0643\u0632 *",
    adminPlaceholder: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0633\u0624\u0648\u0644",
    adminHelper: "\u0647\u0648 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u062a\u0646\u0638\u064a\u0645\u064a \u0627\u0644\u0623\u0648\u0644 \u0639\u0646 \u0627\u0644\u0645\u0631\u0643\u0632.",
    adminQuick: "\u0625\u0636\u0627\u0641\u0629 \u0633\u0631\u064a\u0639\u0629",
    supervisorsLabel: "\u0627\u0644\u0645\u0634\u0631\u0641\u0648\u0646",
    supervisorsHelper:
      "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0634\u0631\u0641\u064a\u0646 \u0627\u0644\u0630\u064a\u0646 \u064a\u062a\u0627\u0628\u0639\u0648\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u0631\u0643\u0632. \u064a\u0645\u0643\u0646\u0643 \u062a\u062d\u062f\u064a\u062f \u0623\u0643\u062b\u0631 \u0645\u0646 \u0627\u0633\u0645.",
    supervisorsQuick: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0634\u0631\u0641",
    multiHint: "\u0627\u0633\u062a\u062e\u062f\u0645 Ctrl + \u0646\u0642\u0631\u0629 \u0644\u062a\u062d\u062f\u064a\u062f \u0623\u0643\u062b\u0631 \u0645\u0646 \u0645\u0634\u0631\u0641.",
    brandingTitle: "\u0627\u0644\u0647\u0648\u064a\u0629 \u0627\u0644\u0628\u0635\u0631\u064a\u0629",
    brandingHint:
      "\u0627\u062e\u062a\u0631 \u0634\u0639\u0627\u0631\u064b\u0627 \u0648\u0627\u0636\u062d\u064b\u0627 \u064a\u0638\u0647\u0631 \u0641\u064a \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0631\u0643\u0632 \u0648\u0648\u0627\u062c\u0647\u0627\u062a \u0627\u0644\u0625\u062f\u0627\u0631\u0629.",
    brandingLabel: "\u0634\u0639\u0627\u0631 \u0627\u0644\u0645\u0631\u0643\u0632",
    brandingHelper: "\u064a\u064f\u0641\u0636\u0644 \u0635\u0648\u0631\u0629 \u0645\u0631\u0628\u0639\u0629 \u0628\u062e\u0644\u0641\u064a\u0629 \u0648\u0627\u0636\u062d\u0629.",
    previewTitle: "\u0645\u0639\u0627\u064a\u0646\u0629 \u0641\u0648\u0631\u064a\u0629",
    previewHint:
      "\u0647\u0630\u0647 \u0627\u0644\u062e\u0644\u0627\u0635\u0629 \u062a\u0633\u062d\u0628 \u0645\u0646 \u0646\u0641\u0633 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0646\u0645\u0648\u0630\u062c \u0642\u0628\u0644 \u0627\u0644\u062d\u0641\u0638.",
    previewName: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632",
    previewLocation: "\u0627\u0644\u0645\u0648\u0642\u0639",
    previewGender: "\u0627\u0644\u0641\u0626\u0629",
    previewManager: "\u0627\u0644\u0645\u062f\u064a\u0631",
    previewSupervisors: "\u0627\u0644\u0645\u0634\u0631\u0641\u0648\u0646",
    previewEmpty: "\u0644\u0645 \u064a\u062d\u062f\u062f \u0628\u0639\u062f",
    previewNoSupervisors: "\u0628\u0644\u0627 \u0645\u0634\u0631\u0641\u064a\u0646 \u062d\u0627\u0644\u064a\u064b\u0627",
    previewSupervisorCount: "\u0645\u0634\u0631\u0641",
    footerNote:
      "\u0633\u064a\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f \u0647\u0630\u0647 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0645\u0628\u0627\u0634\u0631\u0629 \u0641\u064a \u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0632 \u0628\u0639\u062f \u0627\u0644\u062d\u0641\u0638.",
    cancel: "\u0625\u0644\u063a\u0627\u0621",
    create: "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0631\u0643\u0632",
    save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a",
    errorTitle: "\u062a\u0639\u0630\u0631 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062d\u0641\u0638",
    maleShort: "\u0630\u0643\u0648\u0631",
    femaleShort: "\u0625\u0646\u0627\u062b"
  },
  en: {
    modalTitleCreate: "Create New Center",
    modalTitleEdit: "Edit Center",
    overviewEyebrow: "Enterprise workspace",
    overviewTitle: "Prepare the center with a clear institutional structure",
    overviewText:
      "All fields below remain connected to the same create and update payloads already used by the system.",
    statMode: "Operation",
    statModeCreate: "Create",
    statModeEdit: "Update",
    statAdmin: "Manager",
    statAdminAssigned: "Assigned",
    statAdminMissing: "Pending",
    statSupervisors: "Supervisors",
    statSupervisorsValue: "selected",
    identityTitle: "Center identity",
    identityHint:
      "Capture the official center name, location reference, and target audience with a clean structure.",
    nameLabel: "Center Name (Arabic) *",
    namePlaceholder: "Example: Al-Furqan Quran Center",
    nameHelper: "This name appears across management lists and operational reports.",
    mosqueLabel: "Mosque or location name",
    mosquePlaceholder: "Example: Al-Huda Mosque - Al Noor District",
    mosqueHelper: "Used as a recognizable location reference for teams and reports.",
    genderLabel: "Target audience *",
    genderPlaceholder: "Select target audience",
    genderMale: "Males only",
    genderFemale: "Females only",
    genderHelper: "This affects listing, assignment, and filtering behavior.",
    governanceTitle: "Governance and ownership",
    governanceHint:
      "Assign the primary manager and connect supervising roles in a structure that can scale.",
    adminLabel: "Center Manager *",
    adminPlaceholder: "Select the assigned manager",
    adminHelper: "This role owns the administrative operation of the center.",
    adminQuick: "Quick add",
    supervisorsLabel: "Supervisors",
    supervisorsHelper:
      "Choose the supervisors who oversee this center. Multiple selection is supported.",
    supervisorsQuick: "Add supervisor",
    multiHint: "Use Ctrl + Click to select multiple supervisors.",
    brandingTitle: "Visual identity",
    brandingHint:
      "Upload a clean logo that appears consistently across center cards and administrative views.",
    brandingLabel: "Center logo",
    brandingHelper: "A square image with a clean background works best.",
    previewTitle: "Live preview",
    previewHint: "This summary is generated from the same draft data before saving.",
    previewName: "Center name",
    previewLocation: "Location",
    previewGender: "Audience",
    previewManager: "Manager",
    previewSupervisors: "Supervisors",
    previewEmpty: "Not provided yet",
    previewNoSupervisors: "No supervisors selected",
    previewSupervisorCount: "supervisors",
    footerNote: "These changes will be stored directly in the center record after confirmation.",
    cancel: "Cancel",
    create: "Create Center",
    save: "Save Changes",
    errorTitle: "Unable to complete save",
    maleShort: "Male",
    femaleShort: "Female"
  }
} as const;


export function CenterFormModal({
  isOpen,
  mode,
  draft,
  setDraft,
  pending,
  ar,
  canManage,
  adminOpts,
  supOpts,
  onClose,
  onSubmit,
  onOpenQuick
}: CenterFormModalProps) {
  const copy = copyByLanguage[ar ? "ar" : "en"];
  const scheduleTitle = ar ? "جدول دوام مدير المركز" : "Center Admin Duty Schedule";
  const scheduleHint = ar
    ? "حدد وقت بدء الدوام لكل يوم. يمكنك نسخ اليوم على بقية الأيام المفعلة."
    : "Define center-admin duty slots. You can copy one configured day to all enabled days.";

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const circleInstanceRef = useRef<any>(null);

  // Search & Geocoding states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Nearby landmarks POI states
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Dynamic Leaflet Loading Hook
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    let link = document.getElementById("leaflet-css") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.id = "leaflet-css";
      document.head.appendChild(link);
    }

    let script = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.id = "leaflet-js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Map Initialization Effect
  useEffect(() => {
    if (!isOpen || !leafletLoaded || !mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        circleInstanceRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    const initLat = parseFloat(draft.latitude) || 13.5795;
    const initLng = parseFloat(draft.longitude) || 44.0209;
    const hasCoords = !isNaN(parseFloat(draft.latitude)) && !isNaN(parseFloat(draft.longitude));

    // Custom Leaflet marker icons resolution
    const DefaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initLat, initLng], hasCoords ? 18 : 12);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        handleChange("latitude", lat.toFixed(6));
        handleChange("longitude", lng.toFixed(6));
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        circleInstanceRef.current = null;
      }
    };
  }, [isOpen, leafletLoaded]);

  // Sync Marker & Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = (window as any).L;
    if (!L) return;

    const lat = parseFloat(draft.latitude);
    const lng = parseFloat(draft.longitude);
    const radius = parseFloat(draft.allowedRadiusMeters);

    const hasCoords = !isNaN(lat) && !isNaN(lng);

    if (hasCoords) {
      if (!markerInstanceRef.current) {
        // Create draggable marker
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerInstanceRef.current = marker;

        marker.on("dragend", (e: any) => {
          const newLatLng = e.target.getLatLng();
          handleChange("latitude", newLatLng.lat.toFixed(6));
          handleChange("longitude", newLatLng.lng.toFixed(6));
        });
      } else {
        const currentPos = markerInstanceRef.current.getLatLng();
        if (Math.abs(currentPos.lat - lat) > 0.000001 || Math.abs(currentPos.lng - lng) > 0.000001) {
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
      }

      const validRadius = !isNaN(radius) && radius > 0;
      if (validRadius) {
        if (!circleInstanceRef.current) {
          circleInstanceRef.current = L.circle([lat, lng], {
            radius: radius,
            color: "#0d9488",
            fillColor: "#0d9488",
            fillOpacity: 0.15,
            weight: 1.5
          }).addTo(map);
        } else {
          circleInstanceRef.current.setLatLng([lat, lng]);
          circleInstanceRef.current.setRadius(radius);
        }
      } else {
        if (circleInstanceRef.current) {
          circleInstanceRef.current.remove();
          circleInstanceRef.current = null;
        }
      }
    } else {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.remove();
        markerInstanceRef.current = null;
      }
      if (circleInstanceRef.current) {
        circleInstanceRef.current.remove();
        circleInstanceRef.current = null;
      }
    }
  }, [draft.latitude, draft.longitude, draft.allowedRadiusMeters]);

  // Pan to marker if center is moved
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = parseFloat(draft.latitude);
    const lng = parseFloat(draft.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const center = map.getCenter();
      const distance = center.distanceTo([lat, lng]);
      if (distance > 10) {
        const targetZoom = map.getZoom() < 17 ? 18 : map.getZoom();
        map.setView([lat, lng], targetZoom);
      }
    }
  }, [draft.latitude, draft.longitude]);

  // Address lookup API search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&addressdetails=1&accept-language=${ar ? "ar" : "en"}`,
        {
          headers: {
            "User-Agent": "RafiqAlQuranCenterManager/1.0"
          }
        }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Geocoding error", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Distance helper (Haversine formula)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Radius of the earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  // Reverse geocoding helper
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${ar ? "ar" : "en"}`,
        {
          headers: {
            "User-Agent": "RafiqAlQuranCenterManager/1.0"
          }
        }
      );
      const data = await res.json();
      if (data && data.display_name) {
        setResolvedAddress(data.display_name);
      } else {
        setResolvedAddress("");
      }
    } catch (err) {
      console.error("Reverse geocoding error", err);
      setResolvedAddress("");
    } finally {
      setAddressLoading(false);
    }
  }, [ar]);

  // Fetch nearby POIs (Mosques, shops, grocery stores, pharmacies, etc.)
  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number) => {
    setNearbyLoading(true);
    try {
      const query = `[out:json][timeout:15];(node(around:250,${lat},${lng})[amenity];node(around:250,${lat},${lng})[shop];node(around:250,${lat},${lng})[historic];);out body 15;`;
      const res = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data && data.elements) {
        const places = data.elements
          .filter((el: any) => el.tags && el.tags.name)
          .map((el: any) => {
            const dist = getDistance(lat, lng, el.lat, el.lon);
            return {
              id: el.id,
              name: el.tags.name,
              lat: el.lat,
              lng: el.lon,
              distance: Math.round(dist),
              type: el.tags.amenity || el.tags.shop || "landmark"
            };
          })
          .sort((a: any, b: any) => a.distance - b.distance);
        setNearbyPlaces(places);
      } else {
        setNearbyPlaces([]);
      }
    } catch (err) {
      console.error("Error fetching nearby places", err);
      setNearbyPlaces([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  // Debounced reverse geocoding on coordinate change
  useEffect(() => {
    const lat = parseFloat(draft.latitude);
    const lng = parseFloat(draft.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setResolvedAddress("");
      return;
    }

    const timer = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 800);

    return () => clearTimeout(timer);
  }, [draft.latitude, draft.longitude, reverseGeocode]);

  // Debounced fetch of nearby landmarks on coordinate change
  useEffect(() => {
    const lat = parseFloat(draft.latitude);
    const lng = parseFloat(draft.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setNearbyPlaces([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchNearbyPlaces(lat, lng);
    }, 1200);

    return () => clearTimeout(timer);
  }, [draft.latitude, draft.longitude, fetchNearbyPlaces]);

  // Click outside search results to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleChange = useCallback(
    <K extends keyof CenterDraft,>(field: K, value: CenterDraft[K]) => {
      setDraft((previous) => ({ ...previous, [field]: value }));
    },
    [setDraft]
  );

  const modalFooter = useMemo(
    () => (
      <div className="circlemod-footer">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          {copy.cancel}
        </Button>
        <Button variant="primary" isLoading={pending} onClick={onSubmit}>
          {mode === "edit" ? copy.save : copy.create}
        </Button>
      </div>
    ),
    [copy.cancel, copy.create, copy.save, mode, onClose, onSubmit, pending]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? copy.modalTitleEdit : copy.modalTitleCreate}
      titleIcon={
        <div className="circlemod-head-icon">
          <Building2 className="w-4 h-4" />
        </div>
      }
      size="lg"
      panelClassName="circlemod-panel"
      bodyClassName="circlemod-body"
      footerClassName="circlemod-footer-wrap"
      footer={modalFooter}
    >
      <div className="circlemod-form">
        {/* Section 1: Center Identity */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Building2 size={15} className="circlemod-section-icon" />
            <span>{copy.identityTitle}</span>
          </div>
          
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="ctr-name-ar">{copy.nameLabel}</label>
              <input
                id="ctr-name-ar"
                className="circlemod-input"
                value={draft.nameAr}
                onChange={(e) => handleChange("nameAr", e.target.value)}
                placeholder={copy.namePlaceholder}
                disabled={pending}
              />
            </div>
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="ctr-gender">{copy.genderLabel}</label>
              <select
                id="ctr-gender"
                className="circlemod-select"
                value={draft.gender}
                onChange={(e) => handleChange("gender", (e.target.value as CenterGender | "") || "")}
                disabled={pending}
              >
                <option value="">{copy.genderPlaceholder}</option>
                <option value="MALE">{copy.genderMale}</option>
                <option value="FEMALE">{copy.genderFemale}</option>
              </select>
            </div>
          </div>

          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="ctr-mosque">
                <MapPin size={12} className="inline-block ml-1 opacity-60" />
                {copy.mosqueLabel}
              </label>
              <input
                id="ctr-mosque"
                className="circlemod-input"
                value={draft.mosqueName}
                onChange={(e) => handleChange("mosqueName", e.target.value)}
                placeholder={copy.mosquePlaceholder}
                disabled={pending}
              />
            </div>
          </div>
        </div>


        {/* Section: Geo Location */}
        <div className="circlemod-section">
          <div className="circlemod-section-head flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="circlemod-section-icon" />
              <span>{ar ? "الموقع الجغرافي للمركز" : "Center Geo Location"}</span>
            </div>
            <span style={{ fontSize: "11px", color: "#6b7280", marginRight: ar ? "0" : "auto", marginLeft: ar ? "auto" : "0", padding: "0 8px" }}>
              {ar ? "مطلوب لحساب مواقيت الصلاة بدقة" : "Required for accurate prayer times"}
            </span>
            <div className="flex items-center gap-2">
              {(draft.latitude || draft.longitude) && (
                <button
                  type="button"
                  className="circlemod-inline-action text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  onClick={() => {
                    handleChange("latitude", "");
                    handleChange("longitude", "");
                    setResolvedAddress("");
                    setNearbyPlaces([]);
                  }}
                >
                  <span>{ar ? "إلغاء التفعيل الجغرافي" : "Disable Geofence"}</span>
                </button>
              )}
              <button
                type="button"
                className="circlemod-inline-action"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        handleChange("latitude", position.coords.latitude.toFixed(6));
                        handleChange("longitude", position.coords.longitude.toFixed(6));
                      },
                      () => {
                        notifyError(ar ? "تعذر تحديد الموقع الجغرافي. تأكد من تفعيل GPS ومنح الصلاحية للمتصفح." : "Unable to retrieve location. Make sure GPS is enabled and browser permissions are granted.");
                      }
                    );
                  } else {
                    notifyError(ar ? "المتصفح لا يدعم تحديد الموقع الجغرافي." : "Geolocation is not supported by this browser.");
                  }
                }}
              >
                <MapPin size={11} />
                <span>{ar ? "جلب موقعي الحالي (GPS)" : "Get Current Location"}</span>
              </button>
            </div>
          </div>

          {/* Search Row */}
          <div ref={searchContainerRef} className="relative mb-2 mt-1">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  id="ctr-search-loc"
                  className="circlemod-input w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder={ar ? "ابحث عن اسم المسجد، الشارع، أو الحي..." : "Search for mosque, street, or district..."}
                  disabled={pending}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleSearch}
                isLoading={searchLoading}
                disabled={pending || !searchQuery.trim()}
              >
                {ar ? "بحث" : "Search"}
              </Button>
            </div>

            {/* Floating Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-[9999] max-h-[220px] overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    className="w-full text-right ar:text-right en:text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 flex flex-col gap-0.5 transition-colors"
                    onClick={() => {
                      const lat = parseFloat(result.lat).toFixed(6);
                      const lon = parseFloat(result.lon).toFixed(6);
                      handleChange("latitude", lat);
                      handleChange("longitude", lon);
                      setSearchResults([]);
                      setSearchQuery(result.display_name);
                    }}
                  >
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {result.display_name}
                    </span>
                    {result.address && (
                      <span className="text-[10px] text-slate-400">
                        {[result.address.suburb, result.address.city, result.address.state]
                          .filter(Boolean)
                          .join("، ")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {leafletLoaded ? (
            <div 
              ref={mapContainerRef} 
              style={{ 
                height: "260px", 
                width: "100%", 
                borderRadius: "8px", 
                border: "1px solid #cbd5e1", 
                marginTop: "4px", 
                marginBottom: "8px", 
                zIndex: 1 
              }} 
            />
          ) : (
            <div className="flex items-center justify-center h-[260px] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mt-1 mb-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {ar ? "جاري تحميل الخريطة..." : "Loading map..."}
              </span>
            </div>
          )}

          {/* Real-time Address Banner */}
          {(resolvedAddress || addressLoading) && (
            <div className="flex items-start gap-1.5 p-2 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/60 dark:border-teal-900/40 rounded-lg mb-3">
              <MapPin size={13} className="text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
              <div className="text-[11px] leading-relaxed text-teal-700 dark:text-teal-300">
                <span className="font-bold block mb-0.5">{ar ? "الموقع المحدد حالياً:" : "Selected Address:"}</span>
                {addressLoading ? (
                  <span className="text-slate-400 dark:text-slate-500">{ar ? "جاري جلب العنوان بالتفصيل..." : "Resolving address..."}</span>
                ) : (
                  <span>{resolvedAddress}</span>
                )}
              </div>
            </div>
          )}

          {/* Nearby Places List */}
          {(nearbyPlaces.length > 0 || nearbyLoading) && (
            <div className="mb-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {ar ? "معالم وأماكن مشهورة قريبة (انقر للمحاذاة):" : "Famous Nearby Landmarks (click to snap):"}
              </span>
              {nearbyLoading ? (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 py-1">
                  {ar ? "جاري البحث عن معالم مجاورة..." : "Searching nearby landmarks..."}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                  {nearbyPlaces.map((place) => {
                    let categoryIcon = "📍";
                    if (place.type.includes("worship") || place.type.includes("mosque")) categoryIcon = "🕌";
                    else if (place.type.includes("market") || place.type.includes("grocery") || place.type.includes("shop") || place.type.includes("supermarket")) categoryIcon = "🛒";
                    else if (place.type.includes("pharmacy") || place.type.includes("hospital")) categoryIcon = "💊";
                    else if (place.type.includes("school") || place.type.includes("university")) categoryIcon = "🏫";
                    else if (place.type.includes("restaurant") || place.type.includes("cafe")) categoryIcon = "☕";

                    return (
                      <button
                        key={place.id}
                        type="button"
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 dark:bg-slate-800 dark:hover:bg-teal-950/30 dark:hover:text-teal-400 dark:hover:border-teal-900 border border-slate-200 dark:border-slate-700 rounded-md flex items-center gap-1 transition-all"
                        onClick={() => {
                          handleChange("latitude", place.lat.toFixed(6));
                          handleChange("longitude", place.lng.toFixed(6));
                        }}
                      >
                        <span>{categoryIcon}</span>
                        <span className="font-medium">{place.name}</span>
                        <span className="opacity-60">({place.distance}م)</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="ctr-radius">{ar ? "نطاق التحقق الجغرافي (متر) *" : "Geofence Radius (meters) *"}</label>
              <input
                id="ctr-radius"
                type="number"
                min="10"
                className="circlemod-input"
                value={draft.allowedRadiusMeters}
                onChange={(e) => handleChange("allowedRadiusMeters", e.target.value)}
                placeholder="200"
                disabled={pending}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {ar ? "اترك الإحداثيات فارغة (عبر زر إلغاء التفعيل) لتعطيل التحقق الجغرافي تماماً." : "Leave coordinates blank (via Disable button) to completely disable geo-attendance verification."}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Governance & Team */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Briefcase size={15} className="circlemod-section-icon" />
            <span>{copy.governanceTitle}</span>
          </div>

          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="ctr-admin" className="mb-0">{copy.adminLabel}</label>
                {canManage && (
                  <button
                    type="button"
                    className="circlemod-inline-action"
                    onClick={() => onOpenQuick("CENTER_ADMIN")}
                  >
                    <UserPlus size={11} />
                    <span>{copy.adminQuick}</span>
                  </button>
                )}
              </div>
              <select
                id="ctr-admin"
                className="circlemod-select"
                value={draft.centerAdminUserId === "" ? "" : String(draft.centerAdminUserId)}
                onChange={(e) => handleChange("centerAdminUserId", e.target.value ? Number(e.target.value) : "")}
                disabled={pending}
              >
                <option value="">{copy.adminPlaceholder}</option>
                {adminOpts.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="ctr-supervisors" className="mb-0">{copy.supervisorsLabel}</label>
                {canManage && (
                  <button
                    type="button"
                    className="circlemod-inline-action"
                    onClick={() => onOpenQuick("SUPERVISOR")}
                  >
                    <Users size={11} />
                    <span>{copy.supervisorsQuick}</span>
                  </button>
                )}
              </div>
              <select
                id="ctr-supervisors"
                className="circlemod-select h-auto"
                multiple
                size={3}
                value={draft.supervisorUserIds.map(String)}
                onChange={(e) => handleChange("supervisorUserIds", Array.from(e.target.selectedOptions).map(o => Number(o.value)))}
                disabled={pending}
              >
                {supOpts.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <span className="circlemod-help">{copy.multiHint}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Schedule & Visuals */}
        <div className="circlemod-section circlemod-section--schedule">
          <div className="circlemod-section-head">
            <CalendarClock size={15} className="circlemod-section-icon" />
            <span>{scheduleTitle}</span>
            <span className="circlemod-section-hint">{scheduleHint}</span>
          </div>
          <CircleScheduleEditor
            rows={draft.scheduleRows}
            onChange={(rows) => handleChange("scheduleRows", rows)}
            ar={ar}
            disabled={pending || !draft.centerAdminUserId}
          />
        </div>

        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <ImagePlus size={15} className="circlemod-section-icon" />
            <span>{copy.brandingTitle}</span>
          </div>
          <div className="circlemod-row">
             <div className="circlemod-field circlemod-field--lg">
                <ImageUploadField
                  label={copy.brandingLabel}
                  value={draft.logoUrl}
                  onChange={(next: string) => handleChange("logoUrl", next)}
                  kind="CENTER_LOGO"
                  ar={ar}
                  helperText={copy.brandingHelper}
                  previewAlt={draft.nameAr || "Logo"}
                  disabled={pending}
                />
             </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
