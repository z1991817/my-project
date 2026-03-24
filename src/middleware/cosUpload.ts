/**
 * =====================================================
 * 腾讯云 COS 上传中间件
 * =====================================================
 * 使用内存存储，不保存本地文件
 * =====================================================
 */

import COS from 'cos-nodejs-sdk-v5';
import multer from 'multer';
import path from 'path';

// 初始化 COS 客户端
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

// 使用内存存储
const storage = multer.memoryStorage();

// 文件过滤器：只允许图片
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

/**
 * 上传文件到腾讯云 COS
 * @param fileBuffer - 文件缓冲区
 * @param originalname - 原始文件名
 * @param folder - 文件夹路径，默认 'admin'
 * @returns 文件访问 URL
 */
function uploadToCOS(fileBuffer: Buffer, originalname: string, folder = 'admin'): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const key = `${folder}/image-${uniqueSuffix}${ext}`;

    cos.putObject(
      {
        Bucket: process.env.COS_BUCKET!,
        Region: process.env.COS_REGION!,
        Key: key,
        Body: fileBuffer,
      },
      (err) => {
        if (err) {
          return reject(err);
        }
        const url = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${key}`;
        resolve(url);
      }
    );
  });
}

export { upload, uploadToCOS, cos };
