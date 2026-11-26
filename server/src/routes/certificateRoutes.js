/** routes/certificateRoutes.js - /api/certificates : PDF download (signed in) and PUBLIC verification (no login). */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { idParams } from '../validators/common.js';
import { certCodeParams } from '../validators/miscValidators.js';
import { download, verify } from '../controllers/certificateController.js';

const r = Router();
r.get('/verify/:certCode', validate({ params: certCodeParams }), verify);          // public
r.get('/:id/download', requireAuth, validate({ params: idParams }), download);     // owner / issuer / admin
export default r;
