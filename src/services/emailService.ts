import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.server' });

// 创建邮件传输器
const createTransporter = () => {
  // 根据邮件服务类型配置不同的传输器
  if (process.env.EMAIL_SERVICE === 'QQ') {
    // QQ邮箱配置
    return nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true, // 使用SSL
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // 这里使用的是授权码，不是QQ密码
      },
    });
  } else if (process.env.EMAIL_SERVICE === 'gmail') {
    // Gmail配置
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // 默认配置（Gmail）
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
};

// 邮件选项接口
interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// 发送邮件函数
export const sendEmail = async (mailOptions: MailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptionsWithFrom = {
      from: process.env.EMAIL_FROM,
      ...mailOptions,
    };
    
    await transporter.sendMail(mailOptionsWithFrom);
    console.log('邮件发送成功');
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
};

// 发送验证邮件
export const sendVerificationEmail = async (to: string, token: string): Promise<boolean> => {
  const verificationUrl = `http://localhost:3030/verify-email?token=${token}`;
  
  const mailOptions: MailOptions = {
    to,
    subject: '木墨文坊 - 邮箱验证',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">欢迎注册木墨文坊</h2>
        <p style="color: #666;">请点击下面的链接完成邮箱验证：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            验证邮箱
          </a>
        </div>
        <p style="color: #666;">如果按钮无法点击，请复制以下地址到浏览器中打开：</p>
        <p style="color: #999; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px;">此链接将在24小时后过期。</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">如果您没有注册木墨文坊账户，请忽略此邮件。</p>
      </div>
    `,
  };
  
  return await sendEmail(mailOptions);
};

// 发送密码重置邮件
export const sendPasswordResetEmail = async (to: string, token: string): Promise<boolean> => {
  const resetUrl = `http://localhost:3030/reset-password?token=${token}`;
  
  const mailOptions: MailOptions = {
    to,
    subject: '木墨文坊 - 密码重置',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">密码重置请求</h2>
        <p style="color: #666;">您请求重置木墨文坊账户的密码，请点击下面的链接进行重置：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            重置密码
          </a>
        </div>
        <p style="color: #666;">如果按钮无法点击，请复制以下地址到浏览器中打开：</p>
        <p style="color: #999; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">此链接将在1小时后过期。</p>
        <p style="color: #666;">如果您没有请求重置密码，请忽略此邮件。</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  };
  
  return await sendEmail(mailOptions);
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};