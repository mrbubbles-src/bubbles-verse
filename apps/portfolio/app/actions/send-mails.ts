'use server';

import { autoReply, senderMessage } from '@/data/email_replies';
import { Locale } from '@/i18n-config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});

export async function sendEmail(formData: FormData) {
  const captcha = formData.get('captcha');

  if (!captcha) {
    console.warn('🚫 No Turnstile token provided.');
    return { success: false, error: 'Missing captcha.' };
  }

  const verifyRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${captcha}`,
    },
  );

  const { success: captchaSuccess } = await verifyRes.json();
  if (!captchaSuccess) {
    console.warn('⛔ Turnstile verification failed.');
    return { success: false, error: 'Captcha failed.' };
  }
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;
  const locale = formData.get('locale') as Locale;

  const autoReplyText = autoReply(locale, name);
  const senderText = senderMessage(name, email, message);

  try {
    await transporter.sendMail({
      from: 'Manuel Fahrenholz <contact@mrbubbles-src.dev>',
      to: 'contact@mrbubbles-src.dev',
      replyTo: email,
      subject: `New message from ${name}`,
      html: senderText,
    });

    await transporter.sendMail({
      from: 'Manuel Fahrenholz <contact@mrbubbles-src.dev>',
      to: email,
      replyTo: 'contact@mrbubbles-src.dev',
      subject:
        locale === 'de'
          ? 'Danke für deine Nachricht! 📨'
          : 'Thanks for your message! 📨',
      text: autoReplyText.plainText,
      html: autoReplyText.autoReply,
    });

    return { success: true };
  } catch (error) {
    console.error('SMTP error:', error);
    return { success: false, error };
  }
}
