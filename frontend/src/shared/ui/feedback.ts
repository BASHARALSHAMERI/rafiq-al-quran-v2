import { toast, type ToastOptions } from "react-hot-toast";

export type LocalizedLabel = {
  ar: string;
  en: string;
};

type EntityAction =
  | "activate"
  | "approve"
  | "archive"
  | "complete"
  | "create"
  | "delete"
  | "defer"
  | "export"
  | "generate"
  | "link"
  | "load"
  | "pay"
  | "print"
  | "record"
  | "refresh"
  | "reject"
  | "review"
  | "save"
  | "submit"
  | "update";

type EmptyStateOptions = {
  filtered?: boolean;
  helper?: LocalizedLabel;
};

const DEFAULT_TOAST_OPTIONS: ToastOptions = {
  className: "app-toast",
  duration: 3200
};

const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

export const text = (ar: boolean, copy: LocalizedLabel): string => (ar ? copy.ar : copy.en);

export const commonFeedback = {
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  confirm: { ar: "تأكيد", en: "Confirm" },
  close: { ar: "إغلاق", en: "Close" },
  loadingPage: { ar: "جاري تحميل الصفحة...", en: "Loading page..." },
  loadingState: { ar: "جاري التحميل...", en: "Loading..." },
  errorTitle: { ar: "تعذر إكمال الطلب", en: "Unable to complete the request" },
  errorDescription: {
    ar: "حدثت مشكلة غير متوقعة. يرجى إعادة المحاولة.",
    en: "Something went wrong. Please try again."
  },
  emptyTitle: { ar: "لا توجد بيانات", en: "No data available" },
  emptyDescription: {
    ar: "لا توجد بيانات للعرض حاليًا.",
    en: "There is nothing to show right now."
  },
  noResultsTitle: { ar: "لا توجد نتائج مطابقة", en: "No matching results" },
  noResultsDescription: {
    ar: "جرّب تعديل الفلاتر أو كلمات البحث ثم أعد المحاولة.",
    en: "Try adjusting the filters or search terms."
  },
  appErrorTitle: { ar: "حدث خطأ في التطبيق", en: "Application error" },
  appErrorAction: { ar: "إعادة تحميل الصفحة", en: "Reload page" },
  requestIdLabel: { ar: "رقم الطلب", en: "Request ID" },
  markAsReadSuccess: { ar: "تم تحديث الإشعار", en: "Notification updated" },
  markAllReadSuccess: { ar: "تم تحديث جميع الإشعارات", en: "All notifications were updated" }
} as const;

const actionPhrases: Record<
  Exclude<EntityAction, "load">,
  {
    successAr: (entity: LocalizedLabel) => string;
    successEn: (entity: LocalizedLabel) => string;
    errorAr: (entity: LocalizedLabel) => string;
    errorEn: (entity: LocalizedLabel) => string;
  }
> = {
  activate: {
    successAr: (entity) => `تم تفعيل ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} activated successfully`,
    errorAr: (entity) => `تعذر تفعيل ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to activate ${entity.en}. Please try again.`
  },
  approve: {
    successAr: (entity) => `تم اعتماد ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} approved successfully`,
    errorAr: (entity) => `تعذر اعتماد ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to approve ${entity.en}. Please try again.`
  },
  archive: {
    successAr: (entity) => `تمت أرشفة ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} archived successfully`,
    errorAr: (entity) => `تعذرت أرشفة ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to archive ${entity.en}. Please try again.`
  },
  complete: {
    successAr: (entity) => `تم إنهاء ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} completed successfully`,
    errorAr: (entity) => `تعذر إنهاء ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to complete ${entity.en}. Please try again.`
  },
  create: {
    successAr: (entity) => `تم إنشاء ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} created successfully`,
    errorAr: (entity) => `تعذر إنشاء ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to create ${entity.en}. Please try again.`
  },
  delete: {
    successAr: (entity) => `تم حذف ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} deleted successfully`,
    errorAr: (entity) => `تعذر حذف ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to delete ${entity.en}. Please try again.`
  },
  defer: {
    successAr: (entity) => `تم تأجيل ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} deferred successfully`,
    errorAr: (entity) => `تعذر تأجيل ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to defer ${entity.en}. Please try again.`
  },
  export: {
    successAr: (entity) => `تم تصدير ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} exported successfully`,
    errorAr: (entity) => `تعذر تصدير ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to export ${entity.en}. Please try again.`
  },
  generate: {
    successAr: (entity) => `تم إنشاء ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} generated successfully`,
    errorAr: (entity) => `تعذر إنشاء ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to generate ${entity.en}. Please try again.`
  },
  link: {
    successAr: (entity) => `تم ربط ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} linked successfully`,
    errorAr: (entity) => `تعذر ربط ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to link ${entity.en}. Please try again.`
  },
  pay: {
    successAr: (entity) => `تم صرف ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} paid successfully`,
    errorAr: (entity) => `تعذر صرف ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to pay ${entity.en}. Please try again.`
  },
  print: {
    successAr: (entity) => `تمت طباعة ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} printed successfully`,
    errorAr: (entity) => `تعذرت طباعة ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to print ${entity.en}. Please try again.`
  },
  record: {
    successAr: (entity) => `تم تسجيل ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} recorded successfully`,
    errorAr: (entity) => `تعذر تسجيل ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to record ${entity.en}. Please try again.`
  },
  refresh: {
    successAr: (entity) => `تم تحديث ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} refreshed successfully`,
    errorAr: (entity) => `تعذر تحديث ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to refresh ${entity.en}. Please try again.`
  },
  reject: {
    successAr: (entity) => `تم رفض ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} rejected successfully`,
    errorAr: (entity) => `تعذر رفض ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to reject ${entity.en}. Please try again.`
  },
  review: {
    successAr: (entity) => `تمت مراجعة ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} reviewed successfully`,
    errorAr: (entity) => `تعذرت مراجعة ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to review ${entity.en}. Please try again.`
  },
  save: {
    successAr: (entity) => `تم حفظ ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} saved successfully`,
    errorAr: (entity) => `تعذر حفظ ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to save ${entity.en}. Please try again.`
  },
  submit: {
    successAr: (entity) => `تم إرسال ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} submitted successfully`,
    errorAr: (entity) => `تعذر إرسال ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to submit ${entity.en}. Please try again.`
  },
  update: {
    successAr: (entity) => `تم تحديث ${entity.ar} بنجاح`,
    successEn: (entity) => `${capitalize(entity.en)} updated successfully`,
    errorAr: (entity) => `تعذر تحديث ${entity.ar}. يرجى المحاولة مرة أخرى.`,
    errorEn: (entity) => `Unable to update ${entity.en}. Please try again.`
  }
};

export const entityFeedback = {
  success(ar: boolean, action: Exclude<EntityAction, "load">, entity: LocalizedLabel): string {
    const copy = actionPhrases[action];
    return ar ? copy.successAr(entity) : copy.successEn(entity);
  },
  error(ar: boolean, action: EntityAction, entity: LocalizedLabel): string {
    if (action === "load") {
      return ar
        ? `تعذر تحميل ${entity.ar}. يرجى المحاولة مرة أخرى.`
        : `Unable to load ${entity.en}. Please try again.`;
    }

    const copy = actionPhrases[action];
    return ar ? copy.errorAr(entity) : copy.errorEn(entity);
  }
};

export const validationFeedback = {
  required(ar: boolean, field?: LocalizedLabel): string {
    if (!field) {
      return ar ? "هذا الحقل مطلوب" : "This field is required";
    }

    return ar ? `${field.ar} مطلوب` : `${capitalize(field.en)} is required`;
  },
  select(ar: boolean, field: LocalizedLabel): string {
    return ar ? `يرجى اختيار ${field.ar}` : `Please select ${field.en}`;
  },
  validNumber(ar: boolean, field?: LocalizedLabel): string {
    if (!field) {
      return ar ? "يرجى إدخال قيمة صحيحة" : "Enter a valid value";
    }

    return ar ? `يرجى إدخال ${field.ar} بشكل صحيح` : `Enter a valid ${field.en}`;
  },
  minLength(ar: boolean, field: LocalizedLabel, value: number): string {
    return ar
      ? `${field.ar} يجب أن يحتوي على ${value} أحرف على الأقل`
      : `${capitalize(field.en)} must be at least ${value} characters`;
  }
};

export const emptyStateFeedback = {
  list(ar: boolean, entity: LocalizedLabel, options: EmptyStateOptions = {}) {
    if (options.filtered) {
      return {
        title: text(ar, commonFeedback.noResultsTitle),
        description: text(ar, options.helper ?? commonFeedback.noResultsDescription)
      };
    }

    return {
      title: ar ? `لا توجد ${entity.ar} حاليًا` : `No ${entity.en} available`,
      description: text(ar, options.helper ?? commonFeedback.emptyDescription)
    };
  },
  select(ar: boolean, entity: LocalizedLabel, helper?: LocalizedLabel) {
    return {
      title: ar ? `اختر ${entity.ar}` : `Select ${entity.en}`,
      description:
        helper?.ar && helper.en
          ? text(ar, helper)
          : ar
            ? `ابدأ باختيار ${entity.ar} لعرض البيانات المرتبطة بها.`
            : `Choose a ${entity.en} to view the related data.`
    };
  }
};

export const confirmFeedback = {
  archive(ar: boolean, entity: LocalizedLabel, itemName?: string) {
    return {
      title: ar ? `أرشفة ${entity.ar}` : `Archive ${entity.en}`,
      description: itemName
        ? ar
          ? `سيتم نقل ${itemName} إلى الأرشيف دون حذفه.`
          : `${itemName} will be moved to the archive without being deleted.`
        : ar
          ? `سيتم نقل ${entity.ar} إلى الأرشيف دون حذفها.`
          : `${capitalize(entity.en)} will be moved to the archive without being deleted.`,
      confirmLabel: ar ? "أرشفة" : "Archive"
    };
  }
};

export const notifySuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...DEFAULT_TOAST_OPTIONS,
    ...options,
    className: ["app-toast", "app-toast--success", options?.className].filter(Boolean).join(" ")
  });
};

export const notifyError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    ...DEFAULT_TOAST_OPTIONS,
    duration: 4200,
    ...options,
    className: ["app-toast", "app-toast--error", options?.className].filter(Boolean).join(" ")
  });
};
