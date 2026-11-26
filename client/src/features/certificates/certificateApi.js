
import { api, downloadFile } from '../../shared/api/apiClient.js';

/** GET /api/student/certificates -> certificateController.studentCertificates */
export const studentCertificates = () => api('/student/certificates');
/** GET /api/certificates/:id/download -> certificateController.download (PDF) */
export const downloadCertificate = (c) => downloadFile(`/certificates/${c.id}/download`, `InternHive-${c.certCode}.pdf`);
/** GET /api/certificates/verify/:certCode -> certificateController.verify (PUBLIC, no login) */
export const verifyCertificate = (certCode) => api(`/certificates/verify/${encodeURIComponent(certCode)}`);
