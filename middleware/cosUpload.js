const COS = require('cos-nodejs-sdk-v5');
const multer = require('multer');
const path = require('path');

// 初始化 COS 客户端
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

// 使用内存存储，不保存到本地磁盘
const storage = multer.memoryStorage();

// 文件过滤器：只允许图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  },
  fileFilter: fileFilter
});

/**
 * 上传文件到腾讯云 COS
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} originalname - 原始文件名
 * @param {string} folder - 文件夹路径，默认 'admin'
 * @returns {Promise<string>} - 返回文件的访问 URL
 */
function uploadToCOS(fileBuffer, originalname, folder = 'admin') {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const key = `${folder}/image-${uniqueSuffix}${ext}`;

    cos.putObject({
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: key,
      Body: fileBuffer,
    }, (err, data) => {
      if (err) {
        return reject(err);
      }
      // 构造访问 URL
      const url = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${key}`;
      resolve(url);
    });
  });
}

module.exports = {
  upload,
  uploadToCOS,
  cos,
};
