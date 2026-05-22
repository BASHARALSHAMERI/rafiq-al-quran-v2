import 'dart:io';

import 'package:dio/dio.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

Future<String> downloadReportFile({
  required Dio dio,
  required String downloadUrl,
  required String fileName,
}) async {
  final directory = await getApplicationDocumentsDirectory(); // Better persistence than Temp
  final filePath = path.join(directory.path, fileName);
  
  // Use the provided dio which already has BaseURL and Auth headers
  final response = await dio.get(
    downloadUrl,
    options: Options(
      responseType: ResponseType.bytes,
      followRedirects: true,
    ),
  );
  
  final bytes = response.data;
  if (bytes == null) {
    throw const FileSystemException('Downloaded report payload is empty');
  }

  final file = File(filePath);
  await file.writeAsBytes(bytes, flush: true);
  return file.path;
}

Future<void> openDownloadedReport(String filePath) async {
  final result = await OpenFilex.open(filePath);
  if (result.type != ResultType.done) {
    final message = result.message.trim();
    throw FileSystemException(
      message.isEmpty ? 'No compatible app found to open this file' : message,
    );
  }
}

Future<void> shareDownloadedReport(String filePath, {String? text}) async {
  await Share.shareXFiles([XFile(filePath)], text: text);
}
