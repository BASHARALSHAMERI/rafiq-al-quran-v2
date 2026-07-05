import { Router } from "express";
import { certificatesService } from "./certificates.service";

const publicCertificatesRouter = Router();

publicCertificatesRouter.get("/public/certificates/verify/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await certificatesService.verifyCertificate(token);
    res.status(200).json({
      ok: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default publicCertificatesRouter;
