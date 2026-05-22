import 'package:dio/dio.dart';

class GlobalErrorInterceptor extends Interceptor {
  GlobalErrorInterceptor();

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    String userFriendlyMessage = 'حدث خطأ. يرجى المحاولة لاحقاً.';

    // Attempt to extract backend error message first
    final backendMessage = _extractMessage(err.response?.data);

    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        userFriendlyMessage = 'انتهت مهلة الاتصال. تأكد من جودة الإنترنت لديك.';
        break;
      case DioExceptionType.badCertificate:
        userFriendlyMessage =
            'لا يمكن إتمام الطلب لأسباب أمنية (شهادة غير صالحة).';
        break;
      case DioExceptionType.badResponse:
        final statusCode = err.response?.statusCode;
        if (statusCode == 400) {
          userFriendlyMessage =
              backendMessage ?? 'بعض البيانات غير صالحة، يرجى المراجعة.';
        } else if (statusCode == 401) {
          final sessionExpired =
              err.requestOptions.extra['session_expired'] == true;
          userFriendlyMessage = sessionExpired
              ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.'
              : (backendMessage ?? 'غير مصرح للوصول، تأكد من تسجيل الدخول.');
        } else if (statusCode == 403) {
          userFriendlyMessage = backendMessage ??
              'عذراً، لا تملك الصلاحيات الكافية لهذه العملية.';
        } else if (statusCode == 404) {
          userFriendlyMessage =
              backendMessage ?? 'البيانات أو الصفحة المطلوبة غير موجودة.';
        } else if (statusCode == 422) {
          userFriendlyMessage = backendMessage ?? 'بيانات غير مكتملة أو خاطئة.';
        } else if (statusCode != null && statusCode >= 500) {
          userFriendlyMessage =
              'عذراً، الخادم يواجه مشكلة حالياً. الرجاء المحاولة لاحقاً.';
        } else {
          userFriendlyMessage = backendMessage ?? userFriendlyMessage;
        }
        break;
      case DioExceptionType.cancel:
        userFriendlyMessage = 'تم إلغاء الطلب.';
        break;
      case DioExceptionType.connectionError:
        userFriendlyMessage = 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة.';
        break;
      case DioExceptionType.unknown:
        userFriendlyMessage =
            'حدث خطأ غير معروف. تأكد من اتصالك أو حاول لاحقاً.';
        break;
    }

    final customErr = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: userFriendlyMessage,
      message: userFriendlyMessage,
    );

    handler.next(customErr);
  }

  String? _extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data.containsKey('message') && data['message'] != null) {
        final msg = data['message'];
        if (msg is List && msg.isNotEmpty) {
          return msg.first.toString();
        }
        return msg.toString();
      }
      if (data.containsKey('error') && data['error'] != null) {
        return data['error'].toString();
      }
    }
    return null;
  }
}
