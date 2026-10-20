import type { Request, Response, Router } from 'express';
import express from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { imageUpload, toUploadPath } from '../../utils/imageUpload.util';
import { ROUTES } from '../../config/routes';

export { UPLOADS_DIR } from '../../utils/imageUpload.util';

const MAX_TIP_IMAGES = 5;

export class UploadController {
  uploadTipImages = (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    res.status(201).json({
      success: true,
      data: files.map((file) => toUploadPath('tips', file.filename)),
    });
  };

  build(): Router {
    const router = express.Router();
    router.post(
      ROUTES.uploads.tipImages,
      requireAuth,
      imageUpload('tips', 'images', MAX_TIP_IMAGES),
      this.uploadTipImages,
    );
    return router;
  }
}
