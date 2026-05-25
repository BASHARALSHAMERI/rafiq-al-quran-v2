abstract class RouteNames {
  static const root = '/';
  static const splash = '/splash';
  static const login = '/login';
  static const forgotPassword = '/forgot-password';
  static const selectCenter = '/select-center';
  static const selectCircle = '/select-circle';
  static const forbidden = '/forbidden';

  static const teacherHome = '/teacher';
  static const teacherAttendance = '/teacher/attendance';
  static const teacherPreparation = '/teacher/preparation';
  static const teacherRemoteRecitation = '/teacher/remote-recitation';
  static const teacherGroupAchievement = '/teacher/group-achievement';
  static const teacherHalqa = '/teacher/halqa';
  static const teacherStudentBase = '/teacher/student';
  static const teacherStudentPath = '$teacherStudentBase/:id';
  static String teacherStudentProfile(int id) => '/teacher/student/$id';
  static const teacherRecords = '/teacher/records';
  static const teacherMonthlyPlan = '/teacher/monthly-plan';
  static const teacherMonthlyPlanDetailsPath = '$teacherMonthlyPlan/:id';
  static String teacherMonthlyPlanDetails(int id) => '$teacherMonthlyPlan/$id';
  static const teacherStudentReportBase = '/teacher/student-report';
  static const teacherStudentReportPath = '$teacherStudentReportBase/:id';
  static String teacherStudentReport(int id) => '/teacher/student-report/$id';
  static const teacherHalqaReport = '/teacher/halqa-report';

  static const supervisorHome = '/supervisor';
  static const supervisorTodayVisits = '/supervisor/today-visits';
  static const supervisorHalaqat = '/supervisor/halaqat';
  static const supervisorHalqaVisitBase = '/supervisor/halqa-visit';
  static const supervisorHalqaVisitPath = '$supervisorHalqaVisitBase/:id';
  static String supervisorHalqaVisit(int id) => '/supervisor/halqa-visit/$id';
  static const supervisorTeacherEval = '/supervisor/teacher-eval';
  static const supervisorNotes = '/supervisor/notes';
  static const supervisorReports = '/supervisor/reports';
  static const supervisorHalqaReportBase = '/supervisor/halqa-report';
  static const supervisorHalqaReportPath = '$supervisorHalqaReportBase/:id';
  static String supervisorHalqaReport(int id) => '/supervisor/halqa-report/$id';

  static const studentHome = '/student';
  static const studentAssignments = '/student/assignments';
  static const studentProgress = '/student/progress';
  static const studentMemorizationLog = '/student/memorization';
  static const studentJourney = '/student/journey';
  static const studentRemoteRecitation = '/student/remote-recitation';
  static const studentExams = '/student/exams';
  static const studentProfilePage = '/student/profile';

  static const parentHome = '/parent';
  static const parentChildren = '/parent/children';
  static const parentChildBase = '/parent/child';
  static const parentChildPath = '$parentChildBase/:childId';
  static const parentChildAttendancePath =
      '$parentChildBase/:childId/attendance';
  static const parentChildResultsPath = '$parentChildBase/:childId/results';
  static String parentChildDetail(String id) => '/parent/child/$id';
  static String parentChildAttendance(String id) =>
      '/parent/child/$id/attendance';
  static String parentChildResults(String id) => '/parent/child/$id/results';

  static const notifications = '/notifications';
  static const notificationDetailsPath = '$notifications/:id';
  static String notificationDetails(int id) => '$notifications/$id';
  static const profile = '/profile';

  // Legacy aliases kept for compatibility with existing screen code.
  static const home = teacherHome;
  static const students = teacherHalqa;
  static const records = teacherRecords;
  static const monthlyPlan = teacherMonthlyPlan;
  static String studentPlanDetails(int id) => teacherMonthlyPlanDetails(id);
  static const groupAchievement = teacherGroupAchievement;
  static const circles = supervisorHalaqat;
  static const teacherEval = supervisorTeacherEval;
  static String halqaVisit(int id) => supervisorHalqaVisit(id);
  static const halqaVisitBase = supervisorHalqaVisitBase;
  static const attendance = teacherAttendance;
  static const childrenList = parentChildren;
  static String childDetail(String id) => parentChildDetail(id);
  static const homeNotifications = notifications;
  static const homeLibrary = '/library';
  static const homeExams = studentExams;
  static const attendanceMark = '/teacher/attendance/mark';

  static String studentProfile(int id) => teacherStudentProfile(id);
  static String attendanceMarkWithDate(String dateIso) =>
      '$attendanceMark?date=$dateIso';

  static String homeForRole(String? role) {
    switch ((role ?? '').toUpperCase()) {
      case 'SUPERVISOR':
        return supervisorHome;
      case 'SUPER_ADMIN':
      case 'CENTER_ADMIN':
      case 'ACCOUNTANT':
      case 'FINANCE_MANAGER':
      case 'TREASURER':
      case 'AUDITOR':
        return forbidden;
      case 'STUDENT':
        return studentHome;
      case 'PARENT':
        return parentHome;
      case 'TEACHER':
      default:
        return teacherHome;
    }
  }
}
