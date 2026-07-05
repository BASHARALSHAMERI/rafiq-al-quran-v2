import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, XCircle, Loader2, Award, Calendar, Bookmark, Building, CheckCircle2 } from "lucide-react";
import { certificatesApi } from "../features/certificates/certificates.api";
import { getLocalizedApiErrorMessage } from "../shared/api/error";

type VerificationData = {
  isValid: boolean;
  kind: string;
  studentName: string;
  certificateTitle: string;
  examTitle?: string;
  examCategory?: string;
  gradeLabel?: string;
  examDate?: string;
  associationName: string;
  centerName: string;
  riwaya?: string;
  certificateSerial: string;
};

export default function CertificateVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError("رمز التحقق غير موجود");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await certificatesApi.verifyCertificate(token);
        setData(result);
      } catch (err) {
        setError(
          getLocalizedApiErrorMessage(err, {
            ar: true,
            fallback: "فشل التحقق من صحة الشهادة. الرمز قد يكون تالفاً أو غير صالح."
          })
        );
      } finally {
        setLoading(false);
      }
    };

    void verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 p-6 font-sans text-right" dir="rtl">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-700"></div>

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300 hover:border-teal-500/30">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              رفقاء القرآن
            </span>
          </div>
          <p className="text-slate-400 text-xs font-medium">بوابة التحقق الإلكتروني من الشهادات والوثائق</p>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-teal-500 to-transparent mx-auto mt-4"></div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
            <p className="text-sm font-medium animate-pulse">جاري فحص قاعدة البيانات والتحقق من صحة الوثيقة...</p>
          </div>
        ) : error || !data ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400 animate-bounce">
              <XCircle className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-bold text-rose-400 mb-2">فشل التحقق من الشهادة</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              {error || "الرمز المزود غير صالح أو لم يتم العثور على وثيقة مطابقة."}
            </p>
            <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl text-xs text-rose-300 mb-8 leading-relaxed text-right">
              تنبيـه: يُرجى التأكد من مسح الرمز الصحيح المطبوع على الشهادة الرسمية الصادرة من النظام. إذا كنت تعتقد أن هذا الخطأ غير صحيح، يُرجى مراجعة إدارة المركز.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all duration-200"
            >
              الذهاب لصفحة تسجيل الدخول
            </Link>
          </div>
        ) : !data.isValid ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400 animate-pulse">
              <XCircle className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-bold text-amber-400 mb-2">وثيقة ملغاة أو غير معتمدة</h3>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              تم العثور على السجل المطابق في النظام ولكن حالته الحالية ليست معتمدة أو تم إلغاؤها من قبل الإدارة.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all duration-200"
            >
              الذهاب لصفحة تسجيل الدخول
            </Link>
          </div>
        ) : (
          <div>
            {/* Success Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="inline-block px-3 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-full text-xs text-emerald-300 font-bold mb-2">
                وثيقة معتمدة ورسمية
              </span>
              <h3 className="text-xl font-extrabold text-slate-100">{data.certificateTitle}</h3>
            </div>

            {/* Document Details Card */}
            <div className="bg-slate-850/80 border border-slate-750/50 rounded-xl p-5 mb-8 space-y-4 shadow-inner">
              
              {/* Student Name */}
              <div className="flex items-start gap-3 border-b border-slate-800/60 pb-3">
                <Award className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-xs">اسم الطالبــ/ـة</span>
                  <strong className="block text-slate-100 text-base font-bold mt-0.5">{data.studentName}</strong>
                </div>
              </div>

              {/* Certificate Type / Detail */}
              <div className="flex items-start gap-3 border-b border-slate-800/60 pb-3">
                <Bookmark className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-xs">نوع الإنجاز / التقدير</span>
                  <strong className="block text-slate-100 text-sm mt-0.5">
                    {data.examTitle || data.examCategory || "إتمام حفظ القرآن الكريم"}
                    {data.gradeLabel ? ` (${data.gradeLabel})` : ""}
                  </strong>
                </div>
              </div>

              {/* Riwaya (if applicable) */}
              {data.riwaya && (
                <div className="flex items-start gap-3 border-b border-slate-800/60 pb-3">
                  <Bookmark className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 text-xs">الرواية المقروء بها</span>
                    <strong className="block text-slate-100 text-sm mt-0.5">{data.riwaya}</strong>
                  </div>
                </div>
              )}

              {/* Center & Org */}
              <div className="flex items-start gap-3 border-b border-slate-800/60 pb-3">
                <Building className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-xs">المركز والجهة المصدرة</span>
                  <strong className="block text-slate-100 text-sm mt-0.5">
                    {data.associationName} - مركز {data.centerName}
                  </strong>
                </div>
              </div>

              {/* Date */}
              {data.examDate && (
                <div className="flex items-start gap-3 border-b border-slate-800/60 pb-3">
                  <Calendar className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 text-xs">تاريخ الاعتماد / الإصدار</span>
                    <strong className="block text-slate-100 text-sm mt-0.5">{data.examDate}</strong>
                  </div>
                </div>
              )}

              {/* Serial Code */}
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-xs">رقم الشهادة التسلسلي</span>
                  <strong className="block text-teal-300 text-sm font-mono mt-0.5">{data.certificateSerial}</strong>
                </div>
              </div>

            </div>

            {/* Note */}
            <p className="text-center text-slate-450 text-[10px] leading-relaxed mb-6">
              ملاحظة: هذه الصفحة مرتبطة مباشرة بقواعد البيانات الرسمية لنظام رفقاء القرآن. تطابق المعلومات أعلاه مع الشهادة الورقية يؤكد صحتها ورسميتها.
            </p>

            {/* Actions */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200"
              >
                الذهاب للوحة التحكم للنظام
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
