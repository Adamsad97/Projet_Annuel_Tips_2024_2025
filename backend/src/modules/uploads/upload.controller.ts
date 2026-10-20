import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { requireAuth } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/appError.util';
import { ROUTES } from '../../config/routes';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const TIP_IMAGES_DIR = path.join(UPLOADS_DIR, 'tips');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const tipImagesUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(TIP_IMAGES_DIR, { recursive: true });
      cb(null, TIP_IMAGES_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${IMAGE_EXTENSIONS[file.mimetype]}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGES },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_EXTENSIONS[file.mimetype]) {
      return cb(new AppError('only jpeg, png, webp and gif images are allowed', 400));
    }
    cb(null, true);
  },
}).array('images', MAX_IMAGES);

export class UploadController {
  uploadTipImages = (req: Request, res: Response, next: NextFunction) => {
    tipImagesUpload(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        return next(new AppError(`upload error: ${err.message}`, 400));
      }
      if (err) {
        return next(err);
      }

      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        return next(new AppError('no image provided', 400));
      }

      res.status(201).json({
        success: true,
        data: files.map((file) => `/uploads/tips/${file.filename}`),
      });
    });
  };

  build(): Router {
    const router = express.Router();
    router.post(ROUTES.uploads.tipImages, requireAuth, this.uploadTipImages);
    return router;
  }
}
