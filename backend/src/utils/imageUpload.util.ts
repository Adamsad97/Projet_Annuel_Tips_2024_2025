import type { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { AppError } from './appError.util';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Chemin public (relatif à /api) d'un fichier uploadé, ex: /uploads/avatars/<uuid>.png
export const toUploadPath = (folder: string, filename: string): string =>
  `/uploads/${folder}/${filename}`;

// Middleware d'upload d'images vers uploads/<folder>, fichiers disponibles dans req.files
export function imageUpload(folder: string, field: string, maxFiles: number): RequestHandler {
  const destination = path.join(UPLOADS_DIR, folder);

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(destination, { recursive: true });
        cb(null, destination);
      },
      filename: (_req, file, cb) => {
        cb(null, `${crypto.randomUUID()}${IMAGE_EXTENSIONS[file.mimetype]}`);
      },
    }),
    limits: { fileSize: MAX_IMAGE_SIZE, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_EXTENSIONS[file.mimetype]) {
        return cb(new AppError('only jpeg, png, webp and gif images are allowed', 400));
      }
      cb(null, true);
    },
  }).array(field, maxFiles);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: unknown) => {
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

      next();
    });
  };
}

// Supprime un fichier uploadé à partir de son chemin public (ignore les chemins externes)
export function removeUploadedFile(uploadPath: string | null | undefined): void {
  if (!uploadPath?.startsWith('/uploads/')) return;

  const filePath = path.resolve(UPLOADS_DIR, uploadPath.replace('/uploads/', ''));
  if (!filePath.startsWith(UPLOADS_DIR)) return;

  fs.rmSync(filePath, { force: true });
}
