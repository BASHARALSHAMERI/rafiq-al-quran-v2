import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type { CertificateTemplateData } from "./types";

export const certificatesApi = {
  async getExamAttemptCertificate(attemptId: number): Promise<CertificateTemplateData> {
    const response = await apiClient.get<ApiResponse<CertificateTemplateData>>(
      `/attempts/${attemptId}/certificate`
    );
    return response.data.data;
  },

  async getGoldenRecordCertificate(recordId: number): Promise<CertificateTemplateData> {
    const response = await apiClient.get<ApiResponse<CertificateTemplateData>>(
      `/golden-records/${recordId}/certificate`
    );
    return response.data.data;
  }
};
