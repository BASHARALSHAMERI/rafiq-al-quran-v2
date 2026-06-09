export type LocalizedMessage = { ar: string; en: string };

export const messages = {
  validation: {
    required: (field: string): LocalizedMessage => ({
      ar: `حقل "${field}" مطلوب`,
      en: `${field} is required`
    }),
    atLeastOne: {
      ar: "حقل واحد على الأقل مطلوب",
      en: "At least one field is required"
    },
    atLeastOneProfile: (profile: string): LocalizedMessage => ({
      ar: `حقل واحد على الأقل من ملف ${profile} مطلوب`,
      en: `At least one ${profile} profile field is required`
    }),
    atLeastOneLinks: {
      ar: "حقل واحد على الأقل من الروابط مطلوب",
      en: "At least one links field is required"
    },
    atLeastOnePolicy: {
      ar: "حقل واحد على الأقل من السياسة مطلوب",
      en: "At least one policy field is required"
    },
    atLeastOneCurrency: {
      ar: "حقل واحد على الأقل من العملة مطلوب",
      en: "At least one currency field is required"
    },
    atLeastOneSettings: {
      ar: "حقل واحد على الأقل من الإعدادات مطلوب",
      en: "At least one settings field is required"
    },
    atLeastOneSlot: {
      ar: "حقل واحد على الأقل من المواعيد مطلوب",
      en: "At least one slot field is required"
    },
    identifier: {
      ar: "حقل البريد الإلكتروني أو رقم الهاتف مطلوب",
      en: "identifier is required"
    },
    nameArRequired: {
      ar: "الاسم بالعربية مطلوب",
      en: "nameAr is required"
    },
    genderRequired: {
      ar: "حقل الجنس مطلوب",
      en: "gender is required"
    },
    centerAdminUserIdRequired: {
      ar: "حقل مدير المركز مطلوب",
      en: "centerAdminUserId is required"
    },
    centerIdRequired: {
      ar: "حقل المركز مطلوب",
      en: "centerId is required"
    },
    circleTypeRequired: {
      ar: "حقل نوع الحلقة مطلوب",
      en: "circleType is required"
    },
    primaryTeacherUserIdRequired: {
      ar: "حقل المعلم الأساسي مطلوب",
      en: "primaryTeacherUserId is required"
    },
    fullNameRequired: {
      ar: "الاسم الرباعي (أو الاسم في الملف الشخصي) مطلوب",
      en: "fullName (or profile.fullName) is required"
    },
    actionOrStatusRequired: {
      ar: "الإجراء أو الحالة مطلوب",
      en: "Either action or status is required"
    },
    amountOrOriginalAmountRequired: {
      ar: "المبلغ أو المبلغ الأصلي مطلوب",
      en: "amount or originalAmount is required"
    },
    passwordMinLength: {
      ar: "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل",
      en: "Password must be at least 8 characters"
    },
    passwordMustContainLetter: {
      ar: "يجب أن تحتوي كلمة المرور على حرف واحد على الأقل",
      en: "Must contain at least one letter"
    },
    passwordMustContainNumber: {
      ar: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل",
      en: "Must contain at least one number"
    },
    invalidTimeFormat: {
      ar: "صيغة الوقت غير صحيحة",
      en: "Invalid time format"
    },
    invalidDateFormatYMD: {
      ar: "صيغة التاريخ غير صحيحة، الصيغة المطلوبة: YYYY-MM-DD",
      en: "Invalid date format, expected YYYY-MM-DD"
    },
    invalidDateFormat: {
      ar: "صيغة التاريخ غير صحيحة (YYYY-MM-DD)",
      en: "Invalid date format (YYYY-MM-DD)"
    },
    dateMustBeValid: {
      ar: "التاريخ غير صحيح",
      en: "Date must be valid"
    },
    dateNotInFuture: {
      ar: "التاريخ يجب أن يكون صحيحاً وليس في المستقبل",
      en: "Date must be valid and not in the future"
    },
    currencyCode3Letters: {
      ar: "رمز العملة يجب أن يكون 3 أحرف",
      en: "currency code must be 3 letters"
    },
    endDateAfterStartDate: {
      ar: "تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية",
      en: "endDate must be on or after startDate"
    },
    latLngTogether: {
      ar: "خط العرض وخط الطول يجب إدخالهما معاً",
      en: "latitude and longitude must be provided together"
    },
    latLngClearedTogether: {
      ar: "خط العرض وخط الطول يجب مسحهما معاً",
      en: "latitude and longitude must be cleared together"
    },
    radiusRequiredWithLatLng: {
      ar: "نطاق السماح (بالأمتار) مطلوب عند إدخال خط العرض/الطول",
      en: "allowedRadiusMeters is required when latitude/longitude are provided"
    },
    duplicateDay: {
      ar: "لا يمكن تكرار نفس اليوم",
      en: "Duplicate day is not allowed"
    },
    passScoreExceedsMaxScore: {
      ar: "درجة النجاح لا يمكن أن تتجاوز الدرجة القصوى",
      en: "passScore cannot exceed maxScore"
    },
    defaultQuestionCountGteMin: {
      ar: "عدد الأسئلة الافتراضي يجب أن يكون أكبر من أو يساوي الحد الأدنى",
      en: "defaultQuestionCount must be greater than or equal to minQuestionCount"
    },
    defaultQuestionCountLteMax: {
      ar: "عدد الأسئلة الافتراضي يجب أن يكون أقل من أو يساوي الحد الأقصى",
      en: "defaultQuestionCount must be less than or equal to maxQuestionCount"
    },
    committeeMustHaveChair: {
      ar: "اللجنة يجب أن تحتوي على رئيس واحد بالضبط",
      en: "Committee must contain exactly one chair"
    },
    fromSurahLteToSurah: {
      ar: "سورة البداية يجب أن تكون أقل من أو تساوي سورة النهاية",
      en: "fromSurah must be less than or equal to toSurah"
    },
    questionRangeInvalid: {
      ar: "نطاق الأسئلة غير صحيح",
      en: "Question range is invalid"
    },
    examBranchRequiredForJuz: {
      ar: "فرع الاختبار مطلوب لاختبارات الجزء",
      en: "examBranch is required for JUZ"
    },
    examBranchEmptyForFullQuran: {
      ar: "فرع الاختبار يجب أن يكون فارغاً لاختبارات المصحف كاملاً",
      en: "examBranch must be empty for FULL_QURAN"
    },
    eachJournalLineDebitOrCredit: {
      ar: "كل سطر في القيد يجب أن يحتوي على مدين أو دائن فقط، وليس كليهما",
      en: "Each journal line must contain either debit or credit, not both"
    },
    fromTimeRequiredForClock: {
      ar: "وقت البداية مطلوب لنظام الساعة",
      en: "fromTime is required for CLOCK mode"
    },
    fromPrayerRequiredForPrayer: {
      ar: "وقت الأذان مطلوب لنظام الصلاة",
      en: "fromPrayer is required for PRAYER mode"
    },
    supervisorSchedulesNotManaged: {
      ar: "جداول المشرفين لا تُدار من هنا",
      en: "Supervisor schedules are not managed from the web staff schedule."
    },
    accountingCategoryMismatch: {
      ar: "التصنيف المحاسبي لا يتطابق مع نوع السند",
      en: "accountingCategory does not match voucherType"
    }
  },

  errors: {
    // ==================== GENERIC ====================
    generic: {
      accessDenied: { ar: "ليس لديك صلاحية للوصول", en: "Access denied" },
      forbidden: { ar: "غير مصرح بهذه العملية", en: "Forbidden" },
      notFound: (entity: string): LocalizedMessage => ({
        ar: `${entity} غير موجود`,
        en: `${entity} not found`
      }),
      alreadyExists: (entity: string): LocalizedMessage => ({
        ar: `${entity} موجود مسبقاً`,
        en: `${entity} already exists`
      }),
      versionConflict: (entity: string): LocalizedMessage => ({
        ar: `تعارض في تحديث ${entity}. تم تعديل البيانات من قبل مستخدم آخر.`,
        en: `${entity} was modified by another request`
      }),
      operationFailed: { ar: "تعذر إتمام العملية. يرجى المحاولة مرة أخرى.", en: "Operation failed. Please try again." },
      sessionExpired: { ar: "انتهت الجلسة. سجّل الدخول مرة أخرى.", en: "Your session has expired. Sign in again." },
      invalidData: { ar: "البيانات المدخلة غير صالحة", en: "Invalid data" }
    },

    // ==================== AUTH ====================
    auth: {
      invalidCredentials: { ar: "بيانات الدخول غير صحيحة", en: "Invalid login credentials" },
      webAdminOnly: { ar: "نسخة الويب مخصّصة للمدير العام ومدير المركز فقط", en: "Web access is restricted to administrators only" },
      mobileRestricted: { ar: "نسخة الجوال مخصّصة للمعلمين والمشرفين والطلاب وأولياء الأمور فقط", en: "Mobile access is restricted to teachers, supervisors, students, and parents" },
      accountRequiresPasswordSetup: { ar: "الحساب يتطلب إنشاء كلمة مرور", en: "Account requires password setup" },
      invalidIdentifier: { ar: "المُعرّف غير صالح", en: "Invalid identifier" },
      userNotFoundOrInactive: { ar: "المستخدم غير موجود أو غير نشط", en: "User not found or inactive" },
      accountHasPassword: { ar: "الحساب لديه كلمة مرور بالفعل", en: "Account already has a password" },
      invalidOrExpiredResetToken: { ar: "رمز إعادة التعيين غير صالح أو منتهي الصلاحية", en: "Invalid or expired reset token" },
      invalidRefreshToken: { ar: "رمز التحديث غير صالح", en: "Invalid refresh token" },
      refreshTokenMismatch: { ar: "رمز التحديث غير مطابق", en: "Refresh token mismatch" },
      userNotFound: { ar: "المستخدم غير موجود", en: "User not found" },
      invalidOrExpiredActivationToken: { ar: "رمز التفعيل غير صالح أو منتهي الصلاحية", en: "Invalid or expired activation token" },
      forgotPasswordGeneric: { ar: "إذا كانت بيانات الحساب صحيحة، فسيتم إرسال تعليمات إعادة التعيين.", en: "If the provided credentials are valid, reset instructions have been sent." },
      rateLimited: { ar: "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.", en: "Too many requests. Please try again later." }
    },

    // ==================== USERS ====================
    users: {
      notFound: { ar: "المستخدم غير موجود", en: "User not found" },
      emailUsed: { ar: "البريد الإلكتروني مستخدم مسبقاً", en: "Email is already in use" },
      usernameUsed: { ar: "اسم المستخدم مستخدم مسبقاً", en: "Username is already in use" },
      phoneUsed: { ar: "رقم الهاتف مستخدم مسبقاً", en: "Phone number is already in use" },
      nationalIdUsed: { ar: "رقم الهوية مستخدم مسبقاً", en: "National ID is already in use" },
      uniqueConflict: { ar: "تعارض في البيانات الفريدة", en: "Unique data conflict" },
      centerNotFound: { ar: "المركز غير موجود", en: "Center not found" },
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      teacherProfileOnly: { ar: "ملف المعلم متاح فقط لدور المعلم", en: "Teacher profile is only available for teacher role" },
      supervisorProfileOnly: { ar: "ملف المشرف متاح فقط لدور المشرف", en: "Supervisor profile is only available for supervisor role" },
      centerAdminProfileOnly: { ar: "ملف مدير المركز متاح فقط لدور مدير المركز", en: "Center admin profile is only available for center admin role" },
      studentProfileOnly: { ar: "ملف الطالب متاح فقط لدور الطالب", en: "Student profile is only available for student role" },
      parentProfileOnly: { ar: "ملف ولي الأمر متاح فقط لدور ولي الأمر", en: "Parent profile is only available for parent role" },
      centerLinkingNotAllowed: { ar: "ربط المراكز غير مسموح به لهذا الدور", en: "Center linking is not allowed for this role" },
      circleLinkingNotAllowed: { ar: "ربط الحلقات غير مسموح به لهذا الدور", en: "Circle linking is not allowed for this role" },
      childrenLinkingNotAllowed: { ar: "ربط الأبناء متاح فقط لدور ولي الأمر", en: "Children linking is only available for parent role" },
      enrollmentsNotAllowed: { ar: "التسجيلات متاحة فقط لدور الطالب", en: "Enrollments are only available for student role" },
      notStudent: { ar: "المستخدم ليس طالباً", en: "User is not a student" },
      alreadyDisabled: { ar: "المستخدم معطل بالفعل", en: "User is already inactive" },
      userAlreadyLinkedToCenter: { ar: "المستخدم مرتبط بهذا المركز مسبقاً", en: "User is already linked to this center" },
      centerLinkNotFound: { ar: "ارتباط المركز غير موجود", en: "Center link not found" },
      userAlreadyLinkedToCircle: { ar: "المستخدم مرتبط بهذه الحلقة مسبقاً", en: "User is already linked to this circle" },
      circleLinkNotFound: { ar: "ارتباط الحلقة غير موجود", en: "Circle link not found" },
      parentAlreadyLinked: { ar: "ولي الأمر مرتبط بهذا الطالب مسبقاً", en: "Parent is already linked to this student" },
      parentStudentLinkNotFound: { ar: "ارتباط ولي الأمر والطالب غير موجود", en: "Parent-student link not found" },
      studentAlreadyEnrolled: { ar: "الطالب مسجل في هذه الحلقة مسبقاً", en: "Student is already enrolled in this circle" },
      enrollmentNotFound: { ar: "ارتباط التسجيل غير موجود", en: "Enrollment link not found" },
      cannotResendActivationForActive: { ar: "لا يمكن إعادة إرسال التفعيل لحساب مفعل", en: "Cannot resend activation for an active account" },
      cannotResendActivationForSuspended: { ar: "لا يمكن إعادة إرسال التفعيل لحساب معلق", en: "Cannot resend activation for a suspended account" },
      fieldRequired: (field: string): LocalizedMessage => ({
        ar: `حقل "${field}" إجباري ولم يتم إدخاله`,
        en: `"${field}" is required and was not provided`
      }),
      fieldInvalid: (field: string): LocalizedMessage => ({
        ar: `قيمة حقل "${field}" غير صالحة. يرجى التحقق منها`,
        en: `"${field}" value is invalid. Please check it`
      }),
      fieldEmpty: (field: string): LocalizedMessage => ({
        ar: `حقل "${field}" مطلوب ولا يمكن تركه فارغاً`,
        en: `"${field}" is required and cannot be empty`
      }),
      invalidUserData: { ar: "بيانات المستخدم غير صالحة. يرجى التحقق من الحقول المطلوبة.", en: "Invalid user data. Please check the required fields." },
      oneOrMoreCentersNotFound: { ar: "مركز أو أكثر غير موجود", en: "One or more centers not found" },
      oneOrMoreCirclesNotFound: { ar: "حلقة أو أكثر غير موجودة", en: "One or more circles not found" },
      oneOrMoreStudentsNotFound: { ar: "طالب أو أكثر غير موجود", en: "One or more students not found" },
      oneOrMoreEnrollmentsNotFound: { ar: "حلقة تسجيل أو أكثر غير موجودة", en: "One or more enrollment circles not found" },
      notFoundAfterCreate: { ar: "لم يتم العثور على المستخدم بعد الإنشاء", en: "User not found after creation" },
      createFailed: { ar: "حدث خطأ أثناء إنشاء المستخدم. يرجى المحاولة مرة أخرى.", en: "Error creating user. Please try again." },
      updateFailed: { ar: "حدث خطأ أثناء تحديث المستخدم. يرجى المحاولة مرة أخرى.", en: "Error updating user. Please try again." }
    },

    // ==================== ORG ====================
    org: {
      notFound: { ar: "المنظمة غير موجودة", en: "Organization not found" },
      centerNotFound: { ar: "المركز غير موجود", en: "Center not found" },
      circleNotFound: { ar: "الحلقة غير 존재ة", en: "Circle not found" },
      centerNameArRequired: { ar: "الاسم العربي للمركز/الحلقة مطلوب", en: "Center/Circle Arabic name is required" },
      centerNameArExists: { ar: "الاسم العربي للمركز مستخدم مسبقاً", en: "Center Arabic name already exists" },
      circleNameArExists: { ar: "الاسم العربي للحلقة موجود مسبقاً في هذا المركز", en: "Circle Arabic name already exists in center" },
      centerCodeGenerationFailed: { ar: "تعذر إنشاء كود فريد للمركز", en: "Failed to generate a unique center code" },
      centerUpdateConflict: { ar: "تتعارض بيانات تحديث المركز مع بيانات موجودة مسبقاً", en: "Center update conflicts with existing unique data" },
      primaryTeacherRequired: { ar: "المعلم الأساسي مطلوب", en: "primaryTeacherUserId is required" },
      invalidRole: (role: string): LocalizedMessage => ({
        ar: `دور "${role}" غير صالح`,
        en: `${role} role is invalid`
      }),
      mustBeActive: (entity: string): LocalizedMessage => ({
        ar: `${entity} يجب أن يكون نشطاً`,
        en: `${entity} must be active`
      }),
      weeklyScheduleClockTimeRequired: { ar: "جداول نظام الساعة تتطلب قيم وقت HH:mm", en: "weeklySchedule CLOCK rows require HH:mm time values" },
      weeklyScheduleClockRange: { ar: "نطاق الساعة في الجدول الأسبوعي يجب أن يكون في نفس اليوم و fromTime < toTime", en: "weeklySchedule CLOCK range must be within the same day and fromTime < toTime" },
      weeklySchedulePrayerInvalid: { ar: "قيم الصلاة في الجدول الأسبوعي غير صالحة", en: "weeklySchedule PRAYER values are invalid" },
      weeklySchedulePrayerRange: { ar: "نطاق الصلاة في الجدول الأسبوعي يجب أن يكون في نفس اليوم ومرتباً", en: "weeklySchedule PRAYER range must be within the same day and ordered" },
      weeklyScheduleMustBeArray: { ar: "الجدول الأسبوعي يجب أن يكون مصفوفة", en: "weeklySchedule must be an array" },
      weeklyScheduleMax7Rows: { ar: "الجدول الأسبوعي لا يمكن أن يتجاوز 7 أيام", en: "weeklySchedule cannot exceed 7 rows" },
      weeklyScheduleRowInvalid: { ar: "صف الجدول الأسبوعي غير صالح", en: "weeklySchedule row is invalid" },
      weeklyScheduleDuplicateDay: (day: string): LocalizedMessage => ({
        ar: `الجدول الأسبوعي contains يوم مكرر: ${day}`,
        en: `weeklySchedule has duplicate day: ${day}`
      }),
      weeklySchedulePrayerRequired: { ar: "جداول الصلاة تتطلب fromPrayer و toPrayer", en: "weeklySchedule PRAYER rows require fromPrayer and toPrayer" },
      weeklyScheduleModeInvalid: { ar: "نمط الجدول الأسبوعي غير صالح", en: "weeklySchedule row mode is invalid" }
    },

    // ==================== STAFF OPERATIONS ====================
    staffOps: {
      teachersOwnAttendance: { ar: "المعلم يمكنه تسجيل حضوره فقط", en: "Teachers can only mark their own attendance" },
      accessDeniedForCenters: { ar: "الوصول ممنوع لواحد أو أكثر من المراكز", en: "Access denied for one or more centers" },
      cannotCheckInOnLeave: { ar: "لا يمكن تسجيل الحضور أثناء إجازة", en: "Cannot check in while ON_LEAVE" },
      attendanceAlreadyClosed: { ar: "تم إغلاق الحضور لهذا اليوم", en: "Attendance already closed for today" },
      holidayAttendance: { ar: "لا يمكن تسجيل الحضور في يوم عطلة أسبوعية", en: "Cannot check in on a weekend" },
      holidayCheckout: { ar: "لا يمكن تسجيل الانصراف في يوم عطلة أسبوعية", en: "Cannot check out on a weekend" },
      approvedLeaveAttendance: { ar: "لا يمكن تسجيل الحضور في يوم إجازة معتمدة", en: "Cannot check in on an approved leave day" },
      approvedLeaveCheckout: { ar: "لا يمكن تسجيل الانصراف في يوم إجازة معتمدة", en: "Cannot check out on an approved leave day" },
      noScheduleForDay: { ar: "لا يوجد دوام محدد لهذا اليوم", en: "No schedule found for this day" },
      beforeShiftStart: { ar: "لا يمكن تسجيل الحضور قبل بداية وقت الدوام", en: "Cannot check in before shift start" },
      afterShiftEnd: { ar: "لا يمكن تسجيل الحضور بعد نهاية وقت الدوام", en: "Cannot check in after shift end" },
      checkInRequiredBeforeCheckOut: { ar: "يرجى تسجيل الحضور أولاً قبل تسجيل الانصراف", en: "Check-in is required before check-out" },
      cannotCheckOutOnLeave: { ar: "لا يمكن تسجيل الانصراف أثناء إجازة", en: "Cannot check out while ON_LEAVE" },
      checkoutBeforeHalfShift: { ar: "لا يمكن تسجيل الانصراف قبل مرور نصف مدة الدوام", en: "Cannot check out before half shift duration" },
      centerAccessDenied: { ar: "ليس لديك صلاحية الوصول لهذا المركز", en: "Access denied for this center" },
      excuseAlreadySubmitted: { ar: "تم تقديم عذر لهذا التاريخ مسبقاً", en: "Excuse already submitted for this date" },
      excuseNotFound: { ar: "العذر غير موجود", en: "Excuse not found" },
      excuseNotPending: { ar: "فقط الأعذار المعلقة يمكن تعديلها", en: "Only pending excuses can be updated" },
      excuseStatusInvalid: { ar: "حالة العذر يمكن أن تكون معتمدة أو مرفوضة فقط", en: "Excuse status can only be approved or rejected" },
      excuseSelfHandling: { ar: "لا يمكن معالجة عذر خاص بك", en: "Cannot handle your own excuse" },
      excuseCenterAccessDenied: { ar: "ليس لديك صلاحية لتحديث العذر في هذا المركز", en: "Access denied to update excuse in this center" },
      leaveNotFound: { ar: "طلب الإجازة غير موجود", en: "Leave request not found" },
      leaveNotPending: { ar: "فقط طلبات الإجازة المعلقة يمكن تعديلها", en: "Only pending leave requests can be updated" },
      leaveSelfHandling: { ar: "لا يمكن معالجة طلب إجازة خاص بك", en: "Cannot handle your own leave request" },
      leaveCenterAccessDenied: { ar: "ليس لديك صلاحية لتحديث طلب الإجازة في هذا المركز", en: "Access denied to update leave request in this center" },
      visitLogNotFound: { ar: "سجل الزيارة غير موجود", en: "Visit log not found" },
      visitAlreadyEnded: { ar: "الزيارة منتهية بالفعل", en: "Visit already ended" },
      noCirclesAssigned: { ar: "لم يتم العثور على حلقات مسندة إليك", en: "No circles assigned to you" },
      circleAccessDenied: { ar: "ليس لديك صلاحية الوصول لهذه الحلقة", en: "Access denied for this circle" },
      noAssignedCenterForAttendance: { ar: "لم يتم العثور على مركز مسند للحضور", en: "No assigned center found for attendance" },
      leaveStartBeforeEnd: { ar: "تاريخ بداية الإجازة يجب أن يكون قبل أو يساوي تاريخ النهاية", en: "Leave start date must be on or before end date" },
      noWorkingDaysInRange: { ar: "النطاق المحدد لا يحتوي على أيام عمل بناءً على سياسة الحضور", en: "The specified range has no working days based on attendance policy" },
      unpaidLeaveRequiresSuperAdmin: { ar: "إجازات الخصم (UNPAID) تتطلب موافقة مدير النظام", en: "UNPAID leave requires SUPER_ADMIN approval" },
      noDeductionRuleForUnpaid: { ar: "لا يوجد قاعدة خصم مالية معرفة للإجازات بدون راتب", en: "No financial deduction rule defined for unpaid leave" },
      onlyAdminsUpdateLeaveStatus: { ar: "فقط المدراء يمكنهم تحديث حالة الإجازة", en: "Only admins can update leave status" },
      cannotCancelOthersLeave: { ar: "لا يمكنك إلغاء طلب شخص آخر", en: "Cannot cancel another person's leave request" },
      cannotCancelProcessedLeave: { ar: "لا يمكن إلغاء الطلب لأنه تمت معالجته بالفعل", en: "Cannot cancel a leave request that has already been processed" }
    },

    // ==================== EXAMS ====================
    exams: {
      criteriaNeedsPositiveScore: { ar: "معيار التقييم يجب أن يحتوي على درجة إيجابية واحدة على الأقل", en: "criteria must include at least one positive score" },
      questionCountPolicyRange: { ar: "عدد الأسئلة يجب أن يكون بين 1 و 20", en: "Question count policy must stay between 1 and 20" },
      defaultQuestionCountGteMin: { ar: "عدد الأسئلة الافتراضي يجب أن يكون أكبر من أو يساوي الحد الأدنى", en: "defaultQuestionCount must be greater than or equal to minQuestionCount" },
      defaultQuestionCountLteMax: { ar: "عدد الأسئلة الافتراضي يجب أن يكون أقل من أو يساوي الحد الأقصى", en: "defaultQuestionCount must be less than or equal to maxQuestionCount" },
      invalidSurah: (field: string): LocalizedMessage => ({
        ar: `رقم سورة غير صحيح للحقل ${field}`,
        en: `Invalid surah for ${field}`
      }),
      ayahOutOfRange: (field: string, maxAyah: number): LocalizedMessage => ({
        ar: `${field} يجب أن يكون بين 1 و ${maxAyah}`,
        en: `${field} must be between 1 and ${maxAyah}`
      }),
      questionRangeOrderInvalid: { ar: "ترتيب نطاق الأسئلة غير صحيح", en: "Question range order is invalid" },
      pageNumberRange: { ar: "رقم الصفحة يجب أن يكون بين 1 و 604", en: "pageNumber must be between 1 and 604" },
      lineCountRange: { ar: "عدد الأسطر يجب أن يكون بين 1 و 15", en: "lineCount must be between 1 and 15" },
      difficultyLevelRange: { ar: "مستوى الصعوبة يجب أن يكون بين 1 و 5", en: "difficultyLevel must be between 1 and 5" },
      onlyJuzAndFullQuranSupported: { ar: "فقط نماذج اختبارات الجزء والمصحف كاملاً مدعومة", en: "Only JUZ and FULL_QURAN templates are supported" },
      juzTemplateNeedsBranch: { ar: "نموذج اختبار الجزء يتطلب فرع اختبار صحيح", en: "JUZ template is missing a valid examBranch" },
      questionCountRange: (min: number, max: number): LocalizedMessage => ({
        ar: `عدد الأسئلة يجب أن يكون بين ${min} و ${max}`,
        en: `Question count must stay between ${min} and ${max}`
      }),
      centerNotFound: { ar: "المركز غير موجود", en: "Center not found" },
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      circleNotInCenter: { ar: "الحلقة لا تنتمي إلى المركز المحدد", en: "Circle does not belong to selected center" },
      examNotFound: { ar: "الاختبار غير موجود", en: "Exam not found" },
      attemptNotFound: { ar: "محاولة الاختبار غير موجودة", en: "Attempt not found" },
      invalidCommitteeMembers: { ar: "واحد أو أكثر من أعضاء اللجنة المختارين غير صالحين لهذا المركز", en: "One or more selected committee members are invalid for this center" },
      onlyPublishedExamsWorkable: { ar: "فعاليات الاختبارات المنشورة فقط يمكن العمل عليها", en: "Only attempts in published exam templates can be worked on" },
      attemptCannotBeWorkedOn: { ar: "محاولة الاختبار لا يمكن العمل عليها من حالتها الحالية", en: "Attempt cannot be worked on from its current status" },
      passScoreCannotExceedMax: { ar: "درجة النجاح لا يمكن أن تتجاوز الدرجة القصوى", en: "passScore cannot be greater than maxScore" },
      examBranchRequiredForJuz: { ar: "فرع الاختبار مطلوب لاختبارات الجزء", en: "examBranch is required for JUZ templates" },
      examBranchEmptyForFullQuran: { ar: "فرع الاختبار يجب أن يكون فارغاً لاختبارات المصحف كاملاً", en: "examBranch must be empty for FULL_QURAN templates" },
      onlyDraftCanBeUpdated: { ar: "فقط الاختبارات المسودة يمكن تحديثها", en: "Only DRAFT exams can be updated" },
      onlyDraftCanBeDeleted: { ar: "فقط الاختبارات المسودة يمكن حذفها", en: "Only DRAFT exams can be deleted" },
      onlyDraftCanBePublished: { ar: "فقط الاختبارات المسودة يمكن نشرها", en: "Only DRAFT exams can be published" },
      questionBankItemNotFound: { ar: "عنصر بنك الأسئلة غير موجود", en: "Question bank item not found" },
      attemptsOnlyForPublished: { ar: "محاولات الاختبار يمكن إنشاؤها فقط للاختبارات المنشورة", en: "Attempts can only be created for published exam templates" },
      studentNotFoundOrInactive: { ar: "الطالب غير موجود أو غير نشط", en: "Student not found or inactive" },
      studentNotInCircle: { ar: "الطالب غير مسجل في الحلقة المحددة", en: "Student is not actively enrolled in selected circle" },
      nominationAlreadyExists: { ar: "ترشيح موجود مسبقاً لهذا الطالب والنموذج وتاريخ الاختبار", en: "A nomination already exists for this student, template, and exam date" },
      attemptVersionConflict: { ar: "تعارض في إصدار محاولة الاختبار", en: "Exam attempt version conflict" },
      questionCountInsufficient: (available: number, requested: number): LocalizedMessage => ({
        ar: `بنك الأسئلة يحتوي فقط على ${available} سؤال فريد ضمن نطاق الاختبار؛ لا يمكن توليد ${requested} سؤال`,
        en: `Question bank contains only ${available} unique items within the approved exam range; cannot generate ${requested} questions`
      }),
      failedToGenerateQuestions: { ar: "فشل في توليد أسئلة الاختبار", en: "Failed to generate attempt questions" },
      manualQuestionOutOfRange: { ar: "السؤال اليدوي يجب أن يكون ضمن نطاق الاختبار", en: "Manual question must stay within the exam range" },
      failedToCreateManualQuestion: { ar: "فشل في إنشاء السؤال اليدوي", en: "Failed to create manual attempt question" },
      questionNotFoundInAttempt: { ar: "السؤال غير موجود في هذه المحاولة", en: "Question not found in this attempt" },
      atLeastOneQuestionRequired: { ar: "سؤال اختبار واحد على الأقل مطلوب قبل التقييم", en: "At least one exam question is required before scoring" },
      allQuestionsMustBeEvaluated: { ar: "جميع الأسئلة المولدة يجب تقييمها قبل اعتماد النتيجة", en: "All generated questions must be evaluated before submitting the result" },
      failedToScoreAttempt: { ar: "فشل في تقييم محاولة الاختبار", en: "Failed to score attempt" },
      resultCanOnlyBeSharedAfterReview: { ar: "النتيجة يمكن مشاركتها فقط بعد مراجعة الاختبار", en: "Result can only be shared after the exam has been reviewed" },
      nominationNotApproved: { ar: "الترشيح لم يتم اعتماده بعد", en: "Nomination has not been approved yet" },
      onlyCommitteeCanEvaluate: { ar: "فقط أعضاء اللجنة يمكنهم تقييم هذه المحاولة", en: "Only committee members can evaluate this attempt" },
      onlyChairCanPerformAction: { ar: "فقط رئيس اللجنة يمكنه تنفيذ هذا الإجراء", en: "Only the committee chair can perform this action" },
      nominationsOnlyPublished: { ar: "طلبات الترشيح يمكن استخدامها فقط للاختبارات المنشورة", en: "Nomination requests can only use published exam templates" },
      teachersNominateOwnCircle: { ar: "المعلمون يمكنهم ترشيح الطلاب من حلقاتهم فقط", en: "Teachers can only nominate students from their own circles" },
      nominationAlreadyReviewed: { ar: "الترشيحات المعتمدة من المركز لا يمكن مراجعتها مرة أخرى", en: "Center-approved nominations cannot be reviewed again" },
      onlySubmittedCanBeReviewed: { ar: "فقط الترشيحات المقدمة يمكن مراجعتها من إدارة المركز", en: "Only submitted nominations can be reviewed by center administration" },
      nominationMustBeSubmitted: { ar: "الترشيح يجب أن يكون مقدماً قبل اعتماد المركز", en: "Nomination must be submitted before center approval" },
      officialAttemptAlreadyExists: { ar: "محاولة اختبار رسمية موجودة مسبقاً لهذا الطالب وتاريخ الاختبار", en: "An official attempt already exists for this student and exam date" },
      officialNeedsJuzOrFullQuran: { ar: "فقط نماذج الجزء والمصحف كاملاً مدعومة للمحاولات الرسمية", en: "Only JUZ and FULL_QURAN templates are supported for official attempts" },
      atLeastOneQuestionBeforeEvaluation: { ar: "سؤال اختبار واحد على الأقل مطلوب قبل التقييم", en: "At least one exam question is required before evaluation" },
      failedToSaveEvaluation: { ar: "فشل في حفظ التقييم", en: "Failed to save evaluation" },
      allQuestionsBeforeFinalizing: { ar: "جميع أسئلة الاختبار يجب تقييمها قبل الاعتماد النهائي", en: "All exam questions must be evaluated before finalizing" },
      evaluationMustBeSavedBeforeFinalizing: { ar: "التقييم يجب أن يُحفظ قبل الاعتماد النهائي", en: "Evaluation must be saved before finalization" }
    },

    // ==================== STAFF LEAVE ====================
    staffLeave: {
      startBeforeEnd: { ar: "تاريخ بداية الإجازة يجب أن يكون قبل أو يساوي تاريخ النهاية", en: "Leave start date must be on or before end date" },
      noWorkingDays: { ar: "النطاق المحدد لا يحتوي على أيام عمل بناءً على سياسة الحضور", en: "The specified range has no working days based on attendance policy" },
      notFound: { ar: "طلب الإجازة غير موجود", en: "Leave request not found" },
      onlyPendingCanApprove: { ar: "لا يمكن الموافقة إلا على الطلبات المعلقة", en: "Only pending requests can be approved" },
      unpaidNeedsSuperAdmin: { ar: "إجازات الخصم (UNPAID) تتطلب موافقة مدير النظام", en: "UNPAID leave requires SUPER_ADMIN approval" },
      noDeductionRule: { ar: "لا يوجد قاعدة خصم مالية معرفة للإجازات بدون راتب", en: "No financial deduction rule defined for unpaid leave" },
      onlyPendingCanReject: { ar: "لا يمكن رفض إلا الطلبات المعلقة", en: "Only pending requests can be rejected" },
      cannotCancelOthersLeave: { ar: "لا يمكنك إلغاء طلب شخص آخر", en: "Cannot cancel another person's leave request" },
      cannotCancelProcessed: { ar: "لا يمكن إلغاء الطلب لأنه تمت معالجته بالفعل", en: "Cannot cancel a leave request that has already been processed" }
    },

    // ==================== GOLDEN RECORDS ====================
    goldenRecords: {
      candidateAlreadyExists: { ar: "المرشح موجود مسبقاً لهذا الطالب والعام", en: "Candidate already exists for this student and year" },
      approvedCandidateHasRecord: { ar: "المرشح المعتمد لديه سجل ذهبي نهائي بالفعل", en: "Approved candidate already has a final golden record" },
      attemptAlreadyLinked: { ar: "محاولة الاختبار مرتبطة بمرشح آخر بالفعل", en: "Exam attempt is already linked to another candidate" },
      duplicateFinalRecord: { ar: "سجل ذهبي نهائي مكرر لهذا الطالب والعام والنوع", en: "Duplicate final golden record for this student, year, and type" },
      serialConflict: { ar: "تعارض في رقم السجل، يرجى إعادة محاولة الاعتماد", en: "Generated registry serial conflicted, retry the approval" },
      studentNeedsActiveHalaqa: { ar: "الطالب يجب أن يكون لديه حلقة نشطة واحدة على الأقل قبل الترشيح", en: "Student must have one active halaqa before nomination" },
      studentMultipleHalaqas: { ar: "الطالب لديه عدة حلقات نشطة؛ الترشيح يتطلب حلقة نشطة واحدة بالضبط", en: "Student has multiple active halaqas; nomination requires exactly one active halaqa" },
      completionDateError: { ar: "تاريخ إتمام الحفظ لا يمكن أن يكون قبل تاريخ بدء الحفظ", en: "Memorization completion date cannot be earlier than memorization start date" },
      studentNotFound: { ar: "الطالب غير موجود", en: "Student not found" },
      attemptNotFound: { ar: "محاولة الاختبار غير موجودة", en: "Exam attempt not found" },
      attemptMustBeGoldenRecordMushaf: { ar: "محاولة الاختبار يجب أن تنتمي لاختبار مصحف السجل الذهبي", en: "Exam attempt must belong to a GOLDEN_RECORD_MUSHAF exam" },
      attemptBelongsToDifferentStudent: { ar: "محاولة الاختبار تنتمي لطالب آخر", en: "Exam attempt belongs to a different student" },
      attemptBelongsToDifferentCenter: { ar: "محاولة الاختبار تنتمي لمركز آخر", en: "Exam attempt belongs to a different center" },
      attemptBelongsToDifferentHalaqa: { ar: "محاولة الاختبار تنتمي لحلقة أخرى", en: "Exam attempt belongs to a different halaqa" },
      candidateNotFound: { ar: "المرشح للتخرج غير موجود", en: "Graduation candidate not found" },
      finalRecordNotFound: { ar: "السجل الذهبي النهائي غير موجود", en: "Final golden record not found" },
      finalRecordNeedsExamAttempt: { ar: "السجل الذهبي النهائي يتطلب محاولة اختبار من اختبار مصحف السجل الذهبي", en: "Final golden record requires an exam attempt from a GOLDEN_RECORD_MUSHAF exam" },
      finalRecordNeedsApprovedAttempt: { ar: "السجل الذهبي النهائي يتطلب محاولة اختبار معتمدة", en: "Final golden record requires an approved exam attempt" },
      approvedAttemptNeedsScore: { ar: "محاولة الاختبار المعتمدة يجب أن تتضمن درجة نهائية", en: "Approved exam attempt must include a final score" },
      finalRecordNeedsEligibleResult: { ar: "السجل الذهبي النهائي يتطلب نتيجة اختبار مؤهلة ومعتمدة", en: "Final golden record requires an eligible approved exam result" },
      candidateNeedsApprovedExamAttempt: { ar: "المرشح المعتمد يجب ربطه بمحاولة اختبار قبل إنشاء السجل الذهبي النهائي", en: "Approved candidate must be linked to an exam attempt before a final golden record can proceed" },
      linkedAttemptNotFound: { ar: "محاولة الاختبار المرتبطة غير موجودة", en: "Linked exam attempt not found" },
      linkedAttemptMismatch: { ar: "محاولة الاختبار المرتبطة لم تعد تطابق المرشح المعتمد", en: "Linked exam attempt no longer matches the approved candidate" },
      finalRecordIncomplete: { ar: "السجل الذهبي النهائي يتطلب الدرجة والمعدل والتقدير وتاريخ الاختبار", en: "Final golden record requires grade, average, appreciation, and examDate" },
      candidateRequired: { ar: "السجل الذهبي النهائي يجب ربطه بمرشح تخرج معتمد", en: "Final golden record must be linked to an approved graduation candidate" },
      linkedCandidateMustStayApproved: { ar: "المرشح المرتبط يجب أن يبقى معتمداً قبل متابعة السجل الذهبي النهائي", en: "Linked candidate must stay approved before the final golden record can proceed" },
      finalRecordMismatchContext: { ar: "السجل الذهبي النهائي لم يعد يطابق سياق المرشح المرتبط", en: "Final golden record no longer matches the linked candidate context" },
      onlyApprovedCandidatesCanBeLinked: { ar: "فقط المرشحون المعتمدون يمكن ربطهم بمحاولات الاختبار", en: "Only approved candidates can be linked to exam attempts" },
      candidateLocked: { ar: "المرشح لديه سجل ذهبي نهائي مرتبط وهو مقفل", en: "Candidate already has a linked final golden record and is locked" },
      candidateAlreadyHasFinalRecord: { ar: "المرشح لديه سجل ذهبي نهائي مرتبط بالفعل", en: "Candidate already has a linked final golden record" },
      candidateMustBeApproved: { ar: "المرشح يجب أن يكون معتمداً قبل إنشاء سجل ذهبي نهائي مرتبط", en: "Candidate must be approved before creating a linked final golden record" },
      centerNotFound: { ar: "المركز غير موجود", en: "Center not found" },
      halaqaNotFound: { ar: "الحلقة غير موجودة", en: "Halaqa not found" },
      halaqaNotInCenter: { ar: "الحلقة المحددة لا تنتمي إلى مركز السجل الذهبي", en: "Selected halaqa does not belong to the golden record center" },
      finalRecordVersionConflict: { ar: "تعارض في تحديث السجل الذهبي النهائي", en: "Final golden record was modified by another request" },
      candidateVersionConflict: { ar: "تم تعديل المرشح من قبل مستخدم آخر", en: "Candidate was modified by another request" },
      candidateApprovedAndLinked: { ar: "المرشح معتمد وله سجل ذهبي مرتبط", en: "Candidate is approved and has a linked golden record" },
      finalRecordsDontManageExamBindings: { ar: "السجلات الذهبية النهائية لا تدير ربط الاختبارات. اربط محاولة الاختبار المعتمدة على المرشح قبل إنشاء السجل النهائي.", en: "Final golden records do not manage exam bindings. Link the approved exam attempt on the graduation candidate before creating the final record." },
      candidateLinkedRecordsKeepBindings: { ar: "السجلات النهائية المرتبطة بالمرشح تحتفظ بربط الاختبار والحلقة", en: "Candidate-linked final records keep their candidate exam and halaqa bindings" }
    },

    // ==================== CERTIFICATES ====================
    certificates: {
      notAllowedToPrint: { ar: "ليس لديك صلاحية طباعة هذه الشهادة", en: "You are not allowed to print this certificate" },
      attemptNotFound: (id: string): LocalizedMessage => ({
        ar: `محاولة الاختبار بالرقم ${id} غير موجودة أو لا يمكن الوصول إليها`,
        en: `Exam attempt with ID ${id} not found or inaccessible.`
      }),
      orgMismatch: { ar: "ليس لديك صلاحية الوصول لهذه الشهادة (تعارض في المنظمة)", en: "You do not have access to this certificate (organization mismatch)" },
      onlyApprovedOrPublished: { ar: "الشهادة متاحة فقط للمحاولات المعتمدة أو المنشورة", en: "Certificate is available only for approved or published attempts" },
      onlySuccessfulAttempts: { ar: "الشهادة متاحة فقط لمحاولات الاختبار الناجحة", en: "Certificate is available only for successful exam attempts" },
      finalRecordNotFound: { ar: "السجل الذهبي النهائي غير موجود", en: "Final golden record not found" },
      onlyApprovedFinalRecords: { ar: "شهادة الإتمام متاحة فقط للسجلات الذهبية النهائية المعتمدة", en: "Completion certificate is available only for approved final golden records" },
      onlyFullQuranCompletion: { ar: "شهادة الإتمام متاحة لسجلات إتمام القرآن كاملاً", en: "Completion certificate is available for full Quran completion records" },
      requiresRiwayaGradeAppreciation: { ar: "شهادة الإتمام تتطلب الرواية والدرجة والتقدير وتاريخ الاعتماد", en: "Completion certificate requires riwaya, grade, appreciation, and approval date" },
      requiresApprovedSnapshot: { ar: "شهادة الإتمام تتطلب لقطة سجل ذهبي نهائي معتمدة", en: "Completion certificate requires an approved final golden record snapshot" }
    },

    // ==================== ACCOUNTING ====================
    accounting: {
      scopeDenied: { ar: "ليس لديك صلاحية للنطاق المحاسبي", en: "Accounting scope denied" },
      centerScopeDenied: { ar: "ليس لديك صلاحية للنطاق المحاسبي للمركز", en: "Accounting center scope denied" },
      invalidDateRange: { ar: "نطاق التواريخ غير صالح", en: "Invalid date range" },
      invalidField: (field: string): LocalizedMessage => ({
        ar: `حقل ${field} غير صالح`,
        en: `Invalid ${field}`
      }),
      eachJournalLineMustHaveDebitOrCredit: { ar: "كل سطر في القيد يجب أن يحتوي على مدين أو دائن", en: "Each journal line must contain either debit or credit" },
      accountMappingMissing: { ar: "تصنيف الحساب المحاسبي مفقود لترحيل الدفعة", en: "Accounting account mapping is missing for payment posting" },
      parentAccountNotPosting: { ar: "التصنيف المحاسبي يشير إلى حساب أب غير مسموح بالترحيل", en: "Accounting mapping points to a parent account that is not posting allowed" },
      accountPayableMissing: { ar: "حساب الدائنون مفقود لتسوية دفعة المصروف", en: "Accounts payable posting account is missing for expense payment settlement" },
      financeAccountNotFound: { ar: "الحساب المالي غير موجود", en: "Finance account not found" },
      closedFiscalPeriod: { ar: "لا يمكن تنفيذ العملية المالية في فترة مالية مغلقة", en: "Financial operation is not allowed in a closed fiscal period" },
      accountCodeNameTypeRequired: { ar: "رمز الحساب المحاسبي واسمه ونوعه مطلوب", en: "Accounting account code, name and type are required" },
      parentAccountNotFound: { ar: "الحساب الأب غير موجود", en: "Parent accounting account not found" },
      parentTypeMustMatch: { ar: "نوع الحساب الأب يجب أن يطابق نوع الحساب الفرعي", en: "Parent account type must match child account type" },
      parentCenterMustMatch: { ar: "مركز الحساب الأب يجب أن يطابق مركز الحساب الفرعي", en: "Parent account center must match child account center" },
      accountCodeExists: { ar: "رمز الحساب المحاسبي موجود مسبقاً", en: "Accounting account code already exists" },
      accountCannotBeOwnParent: { ar: "الحساب لا يمكن أن يكون أباً لنفسه", en: "Account cannot be its own parent" },
      cannotChangeTypeWithLines: { ar: "لا يمكن تغيير نوع حساب عليه قيود", en: "Cannot change type for an account with journal lines" },
      parentCannotBeUsedInLines: { ar: "الحسابات الأب لا يمكن استخدامها في القيود", en: "Parent accounts cannot be used in journal lines" },
      journalLineCenterMismatch: { ar: "مركز بند القيد لا يطابق مركز الحساب", en: "Journal line center does not match account center" },
      paymentNotFound: { ar: "الدفعة غير موجودة", en: "Payment not found" },
      paymentMustBePosted: { ar: "الدفعة يجب أن تكون مرحلة قبل الترحيل المحاسبي", en: "Payment voucher must be posted before accounting posting" },
      voucherNotFound: { ar: "السند غير موجود", en: "Voucher not found" },
      voucherMustBePosted: { ar: "السند يجب أن يكون مرحلاً قبل الترحيل المحاسبي", en: "Voucher must be posted before accounting posting" },
      categoryMissingForReceipt: { ar: "التصنيف المحاسبي مفقود لترحيل سند القبض", en: "Accounting category is missing for receipt voucher posting" },
      expensePaymentNotFound: { ar: "دفعة المصروف غير موجودة", en: "Expense payment not found" },
      expensePaymentMismatch: { ar: "سند دفع المصروف لا يطابق مدخلات التسوية", en: "Expense payment voucher does not match settlement input" },
      expensePaymentVoucherNotFound: { ar: "سند دفع المصروف غير موجود", en: "Expense payment voucher not found" },
      expensePaymentVoucherMustBePosted: { ar: "سند دفع المصروف يجب أن يكون مرحلاً قبل التسوية المحاسبية", en: "Expense payment voucher must be posted before accounting settlement" },
      voucherNotExpenseDisbursement: { ar: "السند ليس سند صرف مصروف", en: "Voucher is not an expense disbursement voucher" },
      invalidCategoryForDisbursement: (category: string): LocalizedMessage => ({
        ar: `تصنيف محاسبي غير صالح ${category} لسند الصرف`,
        en: `Invalid accounting category ${category} for disbursement voucher`
      }),
      reversalVoucherNotFound: { ar: "سند الإلغاء غير موجود", en: "Reversal voucher not found" },
      fundTransferNotFound: { ar: "تحويل الأموال غير موجود", en: "Fund transfer not found" },
      fundTransferMustBePosted: { ar: "تحويل الأموال يجب أن يكون مرحلاً قبل الترحيل المحاسبي", en: "Fund transfer must be posted before accounting posting" },
      journalEntryNotFound: { ar: "القيد اليومي غير موجود", en: "Journal entry not found" },
      onlyDraftCanBePosted: { ar: "فقط القيود المسودة يمكن ترحيلها", en: "Only draft journal entries can be posted" },
      journalEntryNeedsTwoLines: { ar: "القيد اليومي يجب أن يحتوي على سطرين على الأقل", en: "Journal entry must contain at least two lines" },
      journalEntryNotBalanced: { ar: "القيد اليومي غير متوازن", en: "Journal entry is not balanced" }
    },

    // ==================== FINANCE V2 ====================
    financeV2: {
      expenseAccountNotFound: { ar: "حساب ترحيل المصروفات غير موجود", en: "Expense posting account not found" },
      invoiceNotFound: { ar: "الفاتورة غير موجودة", en: "Invoice not found" },
      onlyDraftPendingCanBeApproved: { ar: "فقط الفواتير المسودة أو المعلقة يمكن اعتمادها", en: "Only DRAFT/PENDING invoices can be approved" },
      expenseCategoryNotLinked: { ar: "التصنيف غير مرتبط بحساب مصروفات ترحيل", en: "Expense category is not linked to a posting expense account" },
      invoiceMustBeApproved: { ar: "الفاتورة يجب أن تكون معتمدة للدفع", en: "Invoice must be approved to be paid" },
      paymentAmountMustBePositive: { ar: "مبلغ الدفع يجب أن يكون أكبر من صفر", en: "Payment amount must be greater than zero" },
      paymentExceedsRemainingBalance: { ar: "الدفعة تتجاوز الرصيد المتبقي للفاتورة", en: "Payment exceeds expense invoice remaining balance" },
      financeAccountNotLinked: { ar: "الحساب المالي غير مرتبط بحساب أصول ترحيل نشط", en: "Finance account is not linked to an active posting asset ledger account" },
      assetCategoryNotFound: { ar: "تصنيف الأصل غير موجود", en: "Asset category not found" },
      supplierNotFound: { ar: "المورد غير موجود", en: "Supplier not found" },
      assetNotFound: { ar: "الأصل غير موجود", en: "Asset not found" },
      assetLinkedToInvoice: { ar: "هذا الأصل مرتبط بفاتورة شراء/مصروف، ويتم ترحيله من خلال الفاتورة لتجنب تكرار القيد.", en: "This asset is linked to a purchase/expense invoice and is posted through the invoice to avoid duplicate entries." },
      assetAlreadyPosted: { ar: "تم ترحيل اكتساب الأصل بالفعل", en: "Asset acquisition is already posted" },
      assetCategoryNoAccount: { ar: "تصنيف الأصل ليس لديه حساب أصول مُعد", en: "Asset category does not have an asset account configured" },
      invalidDepreciationMonth: { ar: "شهر الإهلاك غير صالح", en: "Invalid depreciation month" },
      cannotDepreciateInactive: { ar: "لا يمكن إهلاك أصل غير نشط أو تم التخلص منه", en: "Cannot depreciate an inactive or disposed asset" },
      noUsefulLife: { ar: "الأصل ليس له عمر افتراضي محدد", en: "Asset has no useful life defined" },
      missingDepreciationAccounts: { ar: "تصنيف الأصل يفتقد حسابات الإهلاك", en: "Asset category missing depreciation accounts" },
      depreciationAlreadyPosted: { ar: "إهلاك هذه الفترة مرحلة بالفعل", en: "Depreciation for this period is already posted" },
      depreciationExceedsCost: { ar: "إجمالي الإهلاك سيتجاوز تكلفة الشراء", en: "Total depreciation would exceed purchase cost" },
      currencyNotSupported: { ar: "رمز العملة غير مدعوم", en: "Currency code is not supported" },
      currencyAlreadyExists: { ar: "العملة موجودة مسبقاً", en: "Currency already exists" },
      baseCurrencyAlreadyExists: { ar: "عملة أساسية موجودة مسبقاً", en: "A base currency already exists" },
      currencyNotFound: { ar: "العملة غير موجودة", en: "Currency not found" },
      currencyNotFoundOrInactive: { ar: "العملة غير موجودة أو غير نشطة", en: "Currency not found or inactive" },
      baseCurrencyRateMustBeOne: { ar: "سعر صرف العملة الأساسية يجب أن يكون 1", en: "Base currency rate must be 1" },
      exchangeRateMustBePositive: { ar: "سعر الصرف يجب أن يكون أكبر من صفر", en: "Exchange rate must be greater than zero" },
      assetFieldRequired: (field: string): LocalizedMessage => ({
        ar: `حقل ${field} مطلوب`,
        en: `${field} is required`
      }),
      assetFieldTooLong: (field: string): LocalizedMessage => ({
        ar: `حقل ${field} طويل جداً`,
        en: `${field} is too long`
      }),
      assetMustBePositiveInteger: (field: string): LocalizedMessage => ({
        ar: `حقل ${field} يجب أن يكون رقماً صحيحاً موجباً`,
        en: `${field} must be a positive integer`
      }),
      assetMustBeGreaterThanZero: (field: string): LocalizedMessage => ({
        ar: `حقل ${field} يجب أن يكون أكبر من صفر`,
        en: `${field} must be greater than zero`
      }),
      assetMustBeZeroOrGreater: (field: string): LocalizedMessage => ({
        ar: `حقل ${field} يجب أن يكون صفراً أو أكبر`,
        en: `${field} must be zero or greater`
      }),
      postingAccountNotFound: (field: string): LocalizedMessage => ({
        ar: `حساب ترحيل ${field} غير موجود`,
        en: `${field} posting account not found`
      }),
      centerNotFound: { ar: "المركز غير موجود", en: "Center not found" },
      custodianNotFound: { ar: "الموجوداتي غير موجود", en: "Custodian user not found" }
    },

    // ==================== FINANCE DEDUCTIONS ====================
    financeDeductions: {
      onlySuperAdminCanManage: { ar: "فقط مدير النظام يمكنه إدارة قواعد الخصم", en: "Only SUPER_ADMIN can manage deduction rules" },
      onlySuperAdminCanGenerate: { ar: "فقط مدير النظام يمكنه توليد الاستقطاعات", en: "Only SUPER_ADMIN can generate deductions" },
      invalidStatusFilter: { ar: "فلتر حالة الخصم غير صالح", en: "Invalid deduction status filter" },
      onlySuperAdminCanReview: { ar: "فقط مدير النظام يمكنه مراجعة واعتماد أحداث الخصم", en: "Only SUPER_ADMIN can review and approve deduction events" },
      invalidReviewAction: { ar: "إجراء المراجعة غير صالح", en: "Invalid deduction review action" },
      eventNotFound: { ar: "حدث الخصم غير موجود", en: "Deduction event not found" },
      cannotModifyInPayroll: { ar: "لا يمكن تعديل خصم تم إدراجه في مسير رواتب. استخدم تسوية لاحقة إذا لزم الأمر.", en: "Cannot modify a deduction that has been included in a payroll. Use a subsequent adjustment if needed." }
    },

    // ==================== FOLLOW UPS ====================
    followUps: {
      quranRangeRequired: { ar: "نطاق القرآن يتطلب fromSurah/fromAyah/toSurah/toAyah معاً", en: "Quran range requires fromSurah/fromAyah/toSurah/toAyah together" },
      circleAccessDenied: { ar: "ليس لديك صلاحية الوصول للحلقة المطلوبة", en: "Access denied for requested circle" },
      studentNotEnrolled: { ar: "الطالب غير مسجل في هذه الحلقة", en: "Student is not actively enrolled in this circle" },
      recordNotFound: { ar: "سجل المتابعة غير موجود", en: "Follow-up record was not found" },
      recordAlreadyFinalized: { ar: "سجل المتابعة معتمد نهائياً بالفعل", en: "Follow-up record is already finalized" },
      versionConflict: { ar: "تعارض في تحديث سجل المتابعة", en: "Follow-up record version conflict" }
    },

    // ==================== STAFF SCHEDULE ====================
    staffSchedule: {
      assignmentNotFound: { ar: "تعيين الجدول غير موجود", en: "Schedule assignment not found" },
      teacherAndSupervisorNotManagedHere: { ar: "جداول المعلمين والمشرفين لا تُدار من هنا", en: "Teacher and supervisor schedules are not managed from the web staff schedule." },
      cannotEditCircleSyncedSlots: { ar: "لا يمكن تعديل مواعيد مرتبطة بجدول الحلقة. قم بتعديل جدول الحلقة مباشرة.", en: "Cannot manually edit slots on a circle-synced assignment. Edit the circle schedule instead." },
      cannotDeactivateCircleSynced: { ar: "الجداول المرتبطة بالحلقات لا يمكن إلغاء تفعيلها يدوياً. قم بتحديث الحلقة.", en: "Circle-synced schedules cannot be deactivated manually. Update the circle instead." }
    },

    // ==================== ATTENDANCE ====================
    attendance: {
      circleAccessDenied: { ar: "ليس لديك صلاحية الوصول للحلقة المطلوبة", en: "Access denied for requested circle" },
      duplicateStudentId: { ar: "لا يمكن تكرار معرف الطالب في سجلات الحضور", en: "Duplicate studentId is not allowed in attendance records payload" },
      studentNotEnrolled: (id: string): LocalizedMessage => ({
        ar: `الطالب ذو المعرف ${id} غير مسجل في هذه الحلقة`,
        en: `Student is not enrolled in this circle: ${id}`
      }),
      policyUpdateOnlySuperAdmin: { ar: "فقط مدير النظام يمكنه تحديث سياسة الحضور", en: "Only SUPER_ADMIN can update attendance policy" },
      invalidGeoEnforcement: { ar: "قيمة التفعيل الجغرافي غير صالحة", en: "Invalid geoEnforcement value" }
    },

    // ==================== REMOTE RECITATION ====================
    remoteRecitation: {
      quranRangeRequired: { ar: "نطاق القرآن يتطلب fromSurah/fromAyah/toSurah/toAyah معاً", en: "Quran range requires fromSurah/fromAyah/toSurah/toAyah together" },
      dateRangeInvalid: { ar: "نطاق التواريخ غير صالح: from يجب أن يكون قبل to", en: "Date range is invalid: from must be before to" },
      joinUrlMustBeValid: { ar: "رابط الانضمام يجب أن يكون رابطاً صالحاً", en: "joinUrl must be a valid URL" },
      joinUrlMustUseHttps: { ar: "رابط الانضمام يجب أن يستخدم HTTPS", en: "joinUrl must use HTTPS" },
      joinUrlMustIncludeHostname: { ar: "رابط الانضمام يجب أن يحتوي على اسم المضيف", en: "joinUrl must include a hostname" },
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      circleAccessDenied: { ar: "ليس لديك صلاحية الوصول للحلقة", en: "Access denied for requested circle" },
      teachersOwnCirclesOnly: { ar: "المعلمون يمكنهم إدارة حلقات التلاوة عن بعد الخاصة بهم فقط", en: "Teachers can only manage their own remote recitation circles" },
      teachersOwnBookingsOnly: { ar: "المعلمون يمكنهم إدارة حجوزات التلاوة عن بعد الخاصة بهم فقط", en: "Teachers can only manage their own remote recitation bookings" },
      circleNotActiveForRemote: { ar: "الحلقة غير نشطة للتلاوة عن بعد", en: "Circle is not active for remote recitation" },
      circleTeacherNotActive: { ar: "معلم الحلقة غير نشط", en: "Circle teacher is not active" },
      remoteRecitationDisabled: { ar: "التلاوة عن بعد معطلة لهذه الحلقة", en: "Remote recitation is disabled for this circle" },
      slotEndMustBeAfterStart: { ar: "وقت نهاية الموعد يجب أن يكون بعد وقت البداية", en: "Slot end time must be after start time" },
      slotMustBeInFuture: { ar: "الموعد يجب أن يكون في المستقبل", en: "Slot must be scheduled in the future" },
      slotDurationExact: (minutes: number): LocalizedMessage => ({
        ar: `مدة الموعد يجب أن تكون بالضبط ${minutes} دقيقة`,
        en: `Slot duration must be exactly ${minutes} minutes`
      }),
      slotMaxAdvanceDays: (days: number): LocalizedMessage => ({
        ar: `الموعد يجب أن يكون خلال ${days} أيام من الآن`,
        en: `Slot must be within ${days} days from now`
      }),
      restrictedForRole: { ar: "إعدادات التلاوة عن بعد مقيدة لدورك", en: "Remote recitation settings are restricted for your role" },
      onlyManagersCreateSlots: { ar: "فقط المدراء يمكنهم إنشاء مواعيد التلاوة عن بعد", en: "Only managers can create remote recitation slots" },
      teacherSlotConflict: { ar: "المعلم لديه موعد آخر خلال هذا الوقت", en: "Teacher already has another slot during this time" },
      onlyManagersUpdateSlots: { ar: "فقط المدراء يمكنهم تحديث مواعيد التلاوة عن بعد", en: "Only managers can update remote recitation slots" },
      slotNotFound: { ar: "الموعد غير موجود", en: "Slot not found" },
      teachersUpdateOwnSlotsOnly: { ar: "المعلمون يمكنهم تحديث مواعيدهم فقط", en: "Teachers can only update their own remote recitation slots" },
      slotHasActiveBookings: { ar: "لا يمكن تغيير توقيت الموعد أو تعطيله أثناء وجود حجوزات نشطة", en: "Slot timing cannot be changed or disabled while it has active bookings" },
      onlyManagersRemoveSlots: { ar: "فقط المدراء يمكنهم حذف مواعيد التلاوة عن بعد", en: "Only managers can remove remote recitation slots" },
      slotCannotBeRemovedWithBookings: { ar: "الموعد لا يمكن حذفه أثناء وجود حجوزات نشطة", en: "Slot cannot be removed while it has active bookings" },
      slotVersionConflict: { ar: "تعارض في تحديث الموعد", en: "Slot version conflict" },
      onlyStudentsCanBook: { ar: "فقط الطلاب يمكنهم حجز مواعيد التلاوة عن بعد", en: "Only students can book remote recitation slots" },
      slotNotAvailable: { ar: "الموعد غير متاح", en: "Slot is not available" },
      bookingLeadHours: (hours: number): LocalizedMessage => ({
        ar: `الحجز يجب أن يتم قبل ${hours} ساعة على الأقل من الموعد`,
        en: `Booking must be made at least ${hours} hours in advance`
      }),
      slotAlreadyBooked: { ar: "هذا الموعد محجوز بالفعل", en: "This slot has already been booked" },
      onlyManagersApprove: { ar: "فقط المدراء يمكنهم اعتماد الحجوزات", en: "Only managers can approve bookings" },
      bookingNotFound: { ar: "الحجز غير موجود", en: "Booking not found" },
      onlyRequestedCanBeApproved: { ar: "فقط الحجوزات المطلوبة يمكن اعتمادها", en: "Only requested bookings can be approved" },
      pastBookingsCannotBeApproved: { ar: "لا يمكن اعتماد حجوزات سابقة", en: "Past bookings cannot be approved" },
      bookingVersionConflict: { ar: "تعارض في تحديث الحجز", en: "Booking version conflict" },
      onlyRequestedCanBeRejected: { ar: "فقط الحجوزات المطلوبة يمكن رفضها", en: "Only requested bookings can be rejected" },
      studentsCancelOwnOnly: { ar: "الطلاب يمكنهم إلغاء حجوزاتهم فقط", en: "Students can only cancel their own bookings" },
      cancellationRestricted: { ar: "إلغاء الحجز مقيد لدورك", en: "Booking cancellation is restricted for your role" },
      onlyActiveCanBeCancelled: { ar: "فقط الحجوزات المطلوبة أو المعتمدة يمكن إلغاؤها", en: "Only requested or approved bookings can be cancelled" },
      bookingCancellationWindow: (hours: number): LocalizedMessage => ({
        ar: `الحجوزات يمكن إلغاؤها قبل ${hours} ساعة على الأقل من الموعد`,
        en: `Bookings can only be cancelled at least ${hours} hours before the session`
      }),
      onlyManagersComplete: { ar: "فقط المدراء يمكنهم إتمام حجوزات التلاوة عن بعد", en: "Only managers can complete remote recitation bookings" },
      onlyApprovedCanBeCompleted: { ar: "فقط الحجوزات المعتمدة يمكن إتمامها", en: "Only approved bookings can be completed" },
      bookingAlreadyCompleted: { ar: "الحجز تم إتمامه بالفعل", en: "Booking has already been completed" }
    },

    // ==================== REPORTS ====================
    reports: {
      teacherMonthlyHalqaRequiresCircle: { ar: "تقرير المعلم الشهري للحلقة يتطلب تحديد حلقة", en: "Teacher monthly halqa report requires a circle" },
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      circleOutsideScope: { ar: "تقرير الحلقة خارج نطاق صلاحياتك", en: "Circle report is outside your scope" },
      studentNotFound: { ar: "الطالب غير موجود", en: "Student not found" },
      studentOutsideScope: { ar: "تقرير الطالب خارج نطاق صلاحياتك", en: "Student report is outside your scope" },
      exportFileNotFound: { ar: "ملف التصدير غير موجود", en: "Report export file not found" },
      exportFileExpired: { ar: "ملف التصدير منتهي الصلاحية", en: "Report export file has expired" },
      exportFileUnsupportedType: { ar: "نوع ملف التصدير غير مدعوم", en: "Report export file has unsupported mime type" },
      exportFileTooLarge: { ar: "ملف التصدير يتجاوز الحد الأقصى المسموح به", en: "Report export file exceeds max allowed size" },
      exportFileOutsideScope: { ar: "ملف التصدير خارج نطاق صلاحياتك", en: "Report export file is outside your scope" },
      exportFileOutsideCenterScope: { ar: "ملف التصدير خارج نطاق صلاحية المركز", en: "Report export file is outside your center scope" },
      exportFileOutsideCircleScope: { ar: "ملف التصدير خارج نطاق صلاحية الحلقة", en: "Report export file is outside your circle scope" },
      exportFileMissingFromStorage: { ar: "ملف التصدير غير موجود في التخزين", en: "Report export file is missing from storage" }
    },

    // ==================== LIBRARY ====================
    library: {
      onlySuperAdminOrgVisibility: { ar: "فقط مدير النظام يمكنه إنشاء عناصر مرئية للمنظمة", en: "Only super admin can create ORG visibility items" },
      centerNotFound: { ar: "المركز غير موجود", en: "Center not found" },
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      circleNotInCenter: { ar: "الحلقة لا تنتمي للمركز المحدد", en: "circleId does not belong to selected center" },
      categoryNotFound: { ar: "التصنيف غير موجود", en: "Category not found" },
      categoryNotInCenterScope: { ar: "التصنيف لا ينتمي لنطاق المركز المحدد", en: "Category does not belong to selected center scope" },
      categoryCodeInvalid: { ar: "رمز التصنيف غير صالح", en: "Category code is invalid" },
      centerIdRequiredForRole: { ar: "معرف المركز مطلوب لدورك", en: "centerId is required for your role" },
      categoryCodeExists: { ar: "رمز التصنيف موجود مسبقاً", en: "Category code already exists" },
      fileRequired: { ar: "رفع ملف مطلوب", en: "File upload is required" },
      unsupportedFileType: { ar: "نوع الملف غير مدعوم", en: "Unsupported file type" },
      fileExceedsLimit: { ar: "الملف المرفوع يتجاوز الحد المسموح", en: "Uploaded file exceeds size limit" },
      audioTypeMismatch: { ar: "نوع المحتوى صوتي ولكن الملف ليس من نوع صوتي", en: "Payload type is AUDIO but file content is not an audio family" },
      videoTypeMismatch: { ar: "نوع المحتوى فيديو ولكن الملف ليس من نوع فيديو", en: "Payload type is VIDEO but file content is not a video family" },
      documentTypeMismatch: { ar: "نوع المحتوى مستند ولكن الملف ليس من نوع مستند/صورة", en: "Payload type is DOCUMENT but file content is not a document/image family" },
      teacherCannotUploadOrg: { ar: "المعلم لا يمكنه رفع عناصر على مستوى المنظمة", en: "Teacher cannot upload ORG visibility items" },
      libraryItemNotFound: { ar: "عنصر المكتبة غير موجود", en: "Library item not found" },
      libraryItemOutsideScope: { ar: "عنصر المكتبة خارج نطاق صلاحياتك", en: "Library item is outside your scope" },
      libraryFileMissing: { ar: "ملف المكتبة غير موجود في التخزين", en: "Library file is missing from storage" },
      libraryItemNoCover: { ar: "عنصر المكتبة ليس له غلاف", en: "Library item does not have a cover" },
      coverImageMissing: { ar: "صورة الغلاف غير موجودة في التخزين", en: "Library cover image is missing from storage" }
    },

    // ==================== DASHBOARD ====================
    dashboard: {
      restrictedForRole: { ar: "لوحة التحكم مقيدة لدورك", en: "Dashboard access is restricted for your role" }
    },

    // ==================== NOTIFICATIONS ====================
    notifications: {
      notFound: { ar: "الإشعار غير موجود", en: "Notification not found" }
    },

    // ==================== SUPERVISOR NOTES ====================
    supervisorNotes: {
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      supervisorNeedsCenter: { ar: "المشرف يجب أن ينتمي لمركز واحد على الأقل", en: "Supervisor must belong to at least one center" },
      centerIdRequired: { ar: "معرف المركز مطلوب لهذه الملاحظة", en: "centerId is required for this note" },
      noteNotFound: { ar: "ملاحظة المشرف غير موجودة", en: "Supervisor note not found" }
    },

    // ==================== SUPERVISOR VISITS ====================
    supervisorVisits: {
      invalidPlanStatus: { ar: "حالة خطة الزيارة غير صالحة", en: "Invalid visit plan status" },
      planNotFound: { ar: "خطة الزيارة غير موجودة", en: "Visit plan not found" },
      planItemNotFound: { ar: "عنصر خطة الزيارة غير موجود", en: "Visit plan item not found" },
      centerNotFound: { ar: "المركز غير موجود في نطاق المنظمة", en: "Center not found in organization scope" },
      circleNotFound: { ar: "الحلقة غير موجودة في نطاق المركز", en: "Circle not found in center scope" },
      planItemOutsideScope: { ar: "عنصر الخطة خارج نطاق صلاحياتك", en: "Plan item not found in your scope" },
      visitLogNotFound: { ar: "سجل الزيارة غير موجود", en: "Visit log not found" },
      visitAccessDenied: { ar: "ليس لديك صلاحية الوصول لسجل الزيارة", en: "Access denied to this visit log" },
      visitAlreadyEnded: { ar: "الزيارة منتهية بالفعل", en: "Visit is already ended" }
    },

    // ==================== GROUP ACTIVITIES ====================
    groupActivities: {
      onlyTeachersCreate: { ar: "فقط المعلمون يمكنهم إنشاء أنشطة جماعية", en: "Only teachers can create group activities" },
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      circleAccessDenied: { ar: "ليس لديك صلاحية الوصول للحلقة المطلوبة", en: "Access denied for requested circle" },
      noStudentsPresent: { ar: "لا يوجد طلاب حاضرون لهذا اليوم. يرجى تسجيل الحضور أولاً.", en: "No students present for today. Please mark attendance first." },
      activityNotFound: { ar: "النشاط غير موجود", en: "Activity not found" }
    },

    // ==================== MONTHLY PLANS ====================
    monthlyPlans: {
      circleNotFound: { ar: "الحلقة غير موجودة", en: "Circle not found" },
      accessDenied: { ar: "ليس لديك صلاحية الوصول", en: "Access denied" },
      noActiveStudents: { ar: "لا يوجد طلاب نشطون في هذه الحلقة", en: "No active students in this circle" },
      planNotFound: { ar: "الخطة غير موجودة", en: "Plan not found" },
      cannotModifyApprovedPlan: { ar: "لا يمكن تعديل خطة تم اعتمادها", en: "Cannot modify an approved plan" },
      surahNumberInvalid: (label: string): LocalizedMessage => ({
        ar: `${label}: رقم السورة غير صحيح`,
        en: `${label}: surah number is incorrect`
      }),
      ayahExceedsMax: (label: string, ayahNum: number, maxAyahs: number): LocalizedMessage => ({
        ar: `${label}: رقم الآية ${ayahNum} يتجاوز عدد آيات السورة (${maxAyahs})`,
        en: `${label}: ayah ${ayahNum} exceeds surah's ayah count (${maxAyahs})`
      }),
      surahRangeInvalid: (label: string): LocalizedMessage => ({
        ar: `${label}: نطاق السورة من→إلى غير صحيح`,
        en: `${label}: surah range from→to is incorrect`
      })
    },

    // ==================== QURAN ====================
    quran: {
      surahMustBeBetween1And114: (label: string): LocalizedMessage => ({
        ar: `سورة ${label} يجب أن تكون بين 1 و 114`,
        en: `${label} surah must be between 1 and 114`
      }),
      surahInvalid: (label: string): LocalizedMessage => ({
        ar: `سورة ${label} غير صالحة`,
        en: `${label} surah is invalid`
      }),
      ayahMustBeBetween: (fieldLabel: string, maxAyahs: number): LocalizedMessage => ({
        ar: `آية ${fieldLabel} يجب أن تكون بين 1 و ${maxAyahs}`,
        en: `${fieldLabel} ayah must be between 1 and ${maxAyahs}`
      }),
      quranRangeOrderInvalid: { ar: "ترتيب نطاق القرآن غير صحيح", en: "Quran range order is invalid" },
      metadataUnavailable: { ar: "مزود بيانات القرآن غير متاح ولا توجد نسخة مخبأة احتياطية", en: "Quran metadata provider is unavailable and no fallback cache entry was found" },
      textProviderUnavailable: { ar: "مزود نص القرآن غير متاح لمعاينة هذا السؤال", en: "Quran text provider is unavailable for this question preview" }
    },

    // ==================== AUDIT ====================
    audit: {
      // Audit module typically doesn't throw user-facing errors
    }
  },

  // ==================== SUCCESS MESSAGES ====================
  success: {
    create: (entity: string): LocalizedMessage => ({
      ar: `تم إنشاء ${entity} بنجاح`,
      en: `${entity} created successfully`
    }),
    update: (entity: string): LocalizedMessage => ({
      ar: `تم تحديث ${entity} بنجاح`,
      en: `${entity} updated successfully`
    }),
    delete: (entity: string): LocalizedMessage => ({
      ar: `تم حذف ${entity} بنجاح`,
      en: `${entity} deleted successfully`
    }),
    approve: (entity: string): LocalizedMessage => ({
      ar: `تم اعتماد ${entity} بنجاح`,
      en: `${entity} approved successfully`
    }),
    reject: (entity: string): LocalizedMessage => ({
      ar: `تم رفض ${entity} بنجاح`,
      en: `${entity} rejected successfully`
    }),
    submit: (entity: string): LocalizedMessage => ({
      ar: `تم إرسال ${entity} بنجاح`,
      en: `${entity} submitted successfully`
    }),
    save: (entity: string): LocalizedMessage => ({
      ar: `تم حفظ ${entity} بنجاح`,
      en: `${entity} saved successfully`
    }),
    activate: (entity: string): LocalizedMessage => ({
      ar: `تم تفعيل ${entity} بنجاح`,
      en: `${entity} activated successfully`
    }),
    review: (entity: string): LocalizedMessage => ({
      ar: `تمت مراجعة ${entity} بنجاح`,
      en: `${entity} reviewed successfully`
    }),
    complete: (entity: string): LocalizedMessage => ({
      ar: `تم إنهاء ${entity} بنجاح`,
      en: `${entity} completed successfully`
    })
  },

  // ==================== SYSTEM MESSAGES ====================
  system: {
    zodValidationError: { ar: "بيانات الطلب غير صحيحة. يرجى مراجعة الحقول المطلوبة.", en: "The request data is invalid. Please check the required fields." },
    payloadTooLarge: { ar: "حجم البيانات المرسلة كبير جداً. يرجى تقليل حجم الملف.", en: "The uploaded data is too large. Please reduce the file size." },
    invalidJson: { ar: "صيغة البيانات المرسلة غير صحيحة.", en: "The request data format is invalid." },
    internalServerError: { ar: "تعذر إتمام العملية. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.", en: "Unable to complete the request. Please try again or contact support." }
  }
};

export type MessageCategory =
  | "validation"
  | "errors.auth"
  | "errors.users"
  | "errors.org"
  | "errors.staffOps"
  | "errors.exams"
  | "errors.staffLeave"
  | "errors.goldenRecords"
  | "errors.certificates"
  | "errors.accounting"
  | "errors.financeV2"
  | "errors.financeDeductions"
  | "errors.followUps"
  | "errors.staffSchedule"
  | "errors.attendance"
  | "errors.remoteRecitation"
  | "errors.reports"
  | "errors.library"
  | "errors.dashboard"
  | "errors.notifications"
  | "errors.supervisorNotes"
  | "errors.supervisorVisits"
  | "errors.groupActivities"
  | "errors.monthlyPlans"
  | "errors.quran"
  | "success"
  | "system";
