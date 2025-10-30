// 邮件服务测试脚本
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// 加载环境变量
dotenv.config({ path: '.env.server' });

console.log('Testing email service...');

// 检查环境变量
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

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

// 测试发送邮件
const testEmail = async () => {
  try {
    console.log('Creating transporter...');
    const transporter = createTransporter();
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USERNAME,
      subject: '木墨文坊 - 邮件服务测试',
      html: '<h1>邮件服务测试成功</h1><p>如果您收到这封邮件，说明邮件服务配置正确。</p>'
    });
    
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
};

testEmail();