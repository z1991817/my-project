/**
 * =====================================================
 * Email Service - 邮件发送服务
 * =====================================================
 * 功能：通过 SMTP 发送邮件（验证码等）
 * 依赖：nodemailer
 * =====================================================
 */

const nodemailer = require('nodemailer');

const smtpPort = Number(process.env.SMTP_PORT) || 465;

/**
 * 创建 SMTP 邮件传输器
 * 从环境变量读取 SMTP 配置
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: smtpPort,
  secure: smtpPort === 465, // 465 端口使用 SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * 发送邮箱验证码
 * @param {string} email - 收件人邮箱
 * @param {string} code - 6位数字验证码
 * @returns {Promise<void>}
 */
async function sendVerificationCode(email, code) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'artImg Pro - 邮箱验证码',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">artImg Pro</h2>
        <div style="background: #f7f7f7; border-radius: 8px; padding: 30px; text-align: center;">
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">您的邮箱验证码为：</p>
          <div style="font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">验证码有效期为 2 小时，请勿泄露给他人。</p>
        </div>
        <p style="color: #ccc; font-size: 12px; text-align: center; margin-top: 20px;">
          如果这不是您本人的操作，请忽略此邮件。
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email] 验证码已发送至 ${email}`);
}

module.exports = {
  sendVerificationCode,
};
