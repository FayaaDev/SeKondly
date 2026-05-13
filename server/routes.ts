import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { notificationService } from "./notificationService";
import { insertCaseSchema, insertCommentSchema, insertDocumentSchema, User, commentAgrees, users } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated, isAdmin } from "./middleware/auth";
import nodemailer from "nodemailer";

// Email configuration for AWS SES
const emailTransporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'AKIAVRCYZCTXP6X27O6Q',
    pass: process.env.SMTP_PASS || 'BAoto0SPFrFVlZPumebfgXP2JUy/0720+bW1C8EM+Tr4'
  },
  requireTLS: true
});

// Support ticket schema
const supportTicketSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  title: z.string().min(1, "Title is required"),
  reason: z.enum(["question", "feature", "bug"]),
  content: z.string().min(10, "Content must be at least 10 characters")
});

// Email sending utility functions
async function sendWelcomeEmail(userEmail: string, firstName: string, lastName: string) {
  try {
    console.log(`Attempting to send welcome email to: ${userEmail}`);
    console.log(`SMTP Config - User: ${process.env.SMTP_USER ? 'SET' : 'NOT_SET'}`);
    console.log(`SMTP Config - Pass: ${process.env.SMTP_PASS ? 'SET' : 'NOT_SET'}`);
    
    const welcomeEmailContent = `
Dear Dr. ${firstName} ${lastName},

Welcome to SeKondly! 🎉

Thank you for joining our community of medical professionals. We're excited to have you as part of our platform where healthcare experts collaborate, share knowledge, and discuss complex medical cases.

Here's what happens next:

✅ Your account has been created successfully
⏳ Our medical verification team is currently reviewing your credentials
📧 You'll receive an email notification once your account is approved (typically 1-2 business days)
🔐 Once approved, you can sign in and start contributing to our medical community

What you can do once approved:
• Share and discuss interesting medical cases
• Get second opinions from specialists across different fields
• Connect with fellow medical professionals
• Access our growing library of educational cases
• Participate in professional medical discussions

If you have any questions or need assistance, please don't hesitate to contact our support team by visiting https://sekondly.app/static-landing.html

Welcome to the future of medical collaboration!

Best regards,
The SeKondly Team

---
This email was sent to ${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    `.trim();

    const mailOptions = {
      from: `"SeKondly Team" <admin@sekondly.app>`,
      to: userEmail,
      subject: 'Welcome to SeKondly - Your Account is Being Reviewed',
      text: welcomeEmailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4ECDC4; margin: 0; font-size: 28px;">Welcome to SeKondly! 🎉</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear Dr. ${firstName} ${lastName},</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for joining our community of medical professionals. We're excited to have you as part of our platform where healthcare experts collaborate, share knowledge, and discuss complex medical cases.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #4ECDC4; margin-top: 0;">What happens next:</h3>
              <ul style="line-height: 1.8; color: #333;">
                <li>✅ Your account has been created successfully</li>
                <li>⏳ Our medical verification team is currently reviewing your credentials</li>
                <li>📧 You'll receive an email notification once your account is approved (typically 1-2 business days)</li>
                <li>🔐 Once approved, you can sign in and start contributing to our medical community</li>
              </ul>
            </div>
            
            <div style="background-color: #e8f5f4; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #4ECDC4; margin-top: 0;">What you can do once approved:</h3>
              <ul style="line-height: 1.8; color: #333;">
                <li>Share and discuss interesting medical cases</li>
                <li>Get second opinions from specialists across different fields</li>
                <li>Connect with fellow medical professionals</li>
                <li>Access our growing library of educational cases</li>
                <li>Participate in professional medical discussions</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              If you have any questions or need assistance, please don't hesitate to contact our support team by visiting 
              <a href="https://sekondly.app/static-landing.html" style="color: #4ECDC4; text-decoration: none;">our support page</a>.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 30px;">
              Welcome to the future of medical collaboration!
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Best regards,<br>
              <strong>The SeKondly Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 14px;">
              <p>This email was sent to ${userEmail}</p>
              <p><strong>SeKondly</strong> - Empowering healthcare through collaboration</p>
              <p>Website: <a href="https://sekondly.app" style="color: #4ECDC4;">https://sekondly.app</a></p>
            </div>
          </div>
        </div>
      `
    };

    await emailTransporter.verify();
    console.log('SMTP connection verified for welcome email');
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : undefined,
      command: error instanceof Error && 'command' in error ? error.command : undefined
    });
    return false;
  }
}

async function sendApprovalEmail(userEmail: string, firstName: string, lastName: string) {
  try {
    console.log(`Attempting to send approval email to: ${userEmail}`);
    console.log(`SMTP Config - User: ${process.env.SMTP_USER ? 'SET' : 'NOT_SET'}`);
    console.log(`SMTP Config - Pass: ${process.env.SMTP_PASS ? 'SET' : 'NOT_SET'}`);
    
    const approvalEmailContent = `
Dear Dr. ${firstName} ${lastName},

Great news! Your SeKondly account has been approved! 🎉

Your credentials have been successfully verified by our medical team, and you now have full access to the SeKondly platform.

You can now:
✅ Sign in to your account at https://sekondly.app
✅ Share and discuss medical cases with fellow professionals
✅ Get second opinions from specialists across different medical fields
✅ Connect with other healthcare professionals in your specialty
✅ Access our growing library of educational cases

Getting Started:
1. Visit https://sekondly.app and sign in with your registered email and password
2. Complete your profile to help colleagues find and connect with you
3. Start exploring cases or share your first case with the community
4. Connect with other professionals in your field

We're excited to see you contribute to our growing community of medical professionals!

If you need any help getting started or have questions, please visit our support page at https://sekondly.app/static-landing.html

Welcome to SeKondly!

Best regards,
The SeKondly Team

---
This email was sent to ${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    `.trim();

    const mailOptions = {
      from: `"SeKondly Team" <admin@sekondly.app>`,
      to: userEmail,
      subject: '🎉 Your SeKondly Account Has Been Approved!',
      text: approvalEmailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #28a745; margin: 0; font-size: 28px;">Account Approved! 🎉</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear Dr. ${firstName} ${lastName},</p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <p style="font-size: 18px; line-height: 1.6; color: #155724; margin: 0; font-weight: bold;">
                Great news! Your SeKondly account has been approved!
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Your credentials have been successfully verified by our medical team, and you now have full access to the SeKondly platform.
            </p>
            
            <div style="background-color: #e8f5f4; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #4ECDC4; margin-top: 0;">You can now:</h3>
              <ul style="line-height: 1.8; color: #333;">
                <li>✅ Sign in to your account at <a href="https://sekondly.app" style="color: #4ECDC4;">https://sekondly.app</a></li>
                <li>✅ Share and discuss medical cases with fellow professionals</li>
                <li>✅ Get second opinions from specialists across different medical fields</li>
                <li>✅ Connect with other healthcare professionals in your specialty</li>
                <li>✅ Access our growing library of educational cases</li>
              </ul>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #4ECDC4; margin-top: 0;">Getting Started:</h3>
              <ol style="line-height: 1.8; color: #333;">
                <li>Visit <a href="https://sekondly.app" style="color: #4ECDC4;">https://sekondly.app</a> and sign in with your registered email and password</li>
                <li>Complete your profile to help colleagues find and connect with you</li>
                <li>Start exploring cases or share your first case with the community</li>
                <li>Connect with other professionals in your field</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://sekondly.app" style="background-color: #4ECDC4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Sign In to SeKondly
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              We're excited to see you contribute to our growing community of medical professionals!
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              If you need any help getting started or have questions, please visit our 
              <a href="https://sekondly.app/static-landing.html" style="color: #4ECDC4; text-decoration: none;">support page</a>.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 30px;">
              Welcome to SeKondly!
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Best regards,<br>
              <strong>The SeKondly Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 14px;">
              <p>This email was sent to ${userEmail}</p>
              <p><strong>SeKondly</strong> - Empowering healthcare through collaboration</p>
              <p>Website: <a href="https://sekondly.app" style="color: #4ECDC4;">https://sekondly.app</a></p>
            </div>
          </div>
        </div>
      `
    };

    await emailTransporter.verify();
    console.log('SMTP connection verified for approval email');
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`Approval email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send approval email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : undefined,
      command: error instanceof Error && 'command' in error ? error.command : undefined
    });
    return false;
  }
}

async function sendForgotPasswordEmail(userEmail: string, firstName: string, lastName: string) {
  try {
    console.log(`Sending forgot password notification to admin for user: ${userEmail}`);
    
    const currentDate = new Date();
    const requestDate = currentDate.toLocaleDateString();
    const requestTime = currentDate.toLocaleTimeString();
    
    const forgotPasswordEmailContent = `
Dear Support Team,

A user has requested a password reset for their SeKondly account.

User Details:
- Email: ${userEmail}
- Name: Dr. ${firstName} ${lastName}
- Request Date: ${requestDate}
- Request Time: ${requestTime}

Next Steps:
✉️ Contact the user directly at their registered email address
🔐 Verify their identity before providing password reset assistance
📋 Guide them through the password reset process
✅ Confirm their new password meets security requirements

The user has been notified that their password reset request has been received and that support will contact them directly.

Please handle this request promptly.

Best regards,
SeKondly Automated System

---
This notification was sent to admin@sekondly.app
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    `.trim();

    const mailOptions = {
      from: `"SeKondly Team" <admin@sekondly.app>`,
      to: 'admin@sekondly.app',
      subject: `Password Reset Request - ${userEmail}`,
      text: forgotPasswordEmailContent,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request - SeKondly</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 12px;">
            <div style="background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 0 -20px;">
              <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🔐 Password Reset Request</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">Support Action Required</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; border-top: none;">
              <h2 style="color: #333; margin-top: 0; font-size: 24px;">Dear Support Team,</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                A user has requested a password reset for their SeKondly account.
              </p>
              
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffeaa7;">
                <h3 style="color: #856404; margin-top: 0; font-size: 18px;">👤 User Details:</h3>
                <p style="margin: 8px 0; font-size: 14px; color: #856404;"><strong>Email:</strong> ${userEmail}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #856404;"><strong>Name:</strong> Dr. ${firstName} ${lastName}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #856404;"><strong>Request Date:</strong> ${requestDate}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #856404;"><strong>Request Time:</strong> ${requestTime}</p>
              </div>
              
              <div style="background-color: #e8f5f4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4ECDC4;">
                <h3 style="color: #155724; margin-top: 0;">📋 Next Steps:</h3>
                <ul style="line-height: 1.8; color: #155724; margin: 10px 0; padding-left: 20px;">
                  <li>✉️ Contact the user directly at their registered email address</li>
                  <li>🔐 Verify their identity before providing password reset assistance</li>
                  <li>📋 Guide them through the password reset process</li>
                  <li>✅ Confirm their new password meets security requirements</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                The user has been notified that their password reset request has been received and that support will contact them directly.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 30px;">
                Please handle this request promptly.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Best regards,<br>
                <strong>SeKondly Automated System</strong>
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin: 0 -20px -20px -20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 5px 0; font-size: 14px; color: #666;">This notification was sent to admin@sekondly.app</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>SeKondly</strong> - Empowering healthcare through collaboration</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">Website: <a href="https://sekondly.app" style="color: #4ECDC4;">https://sekondly.app</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.verify();
    await emailTransporter.sendMail(mailOptions);
    console.log(`Forgot password notification sent to admin for user: ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send forgot password email:', error);
    return false;
  }
}

async function sendRejectionEmail(userEmail: string, firstName: string, lastName: string, reason: string) {
  try {
    console.log(`Attempting to send rejection email to: ${userEmail}`);
    
    const rejectionEmailContent = `
Dear Dr. ${firstName} ${lastName},

Thank you for your interest in joining SeKondly. After careful review of your application, we regret to inform you that we cannot approve your account at this time.

Reason for rejection:
${reason}

We appreciate the time you took to apply and wish you the best in your medical career. If you believe this decision was made in error or if you have additional credentials to share, please contact our support team at https://sekondly.app/static-landing.html

Thank you for your understanding.

Best regards,
The SeKondly Team

---
This email was sent to ${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    `.trim();

    const mailOptions = {
      from: `"SeKondly Team" <admin@sekondly.app>`,
      to: userEmail,
      subject: 'SeKondly Account Application Status',
      text: rejectionEmailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc3545; margin: 0; font-size: 24px;">Application Update</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear Dr. ${firstName} ${lastName},</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for your interest in joining SeKondly. After careful review of your application, we regret to inform you that we cannot approve your account at this time.
            </p>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <h3 style="color: #721c24; margin-top: 0; font-size: 16px;">Reason for rejection:</h3>
              <p style="font-size: 16px; line-height: 1.6; color: #721c24; margin: 0; font-weight: 500;">
                ${reason}
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              We appreciate the time you took to apply and wish you the best in your medical career. If you believe this decision was made in error or if you have additional credentials to share, please contact our support team.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://sekondly.app/static-landing.html" style="background-color: #4ECDC4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Contact Support
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for your understanding.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 30px;">
              Best regards,<br>
              <strong>The SeKondly Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 14px;">
              <p>This email was sent to ${userEmail}</p>
              <p><strong>SeKondly</strong> - Empowering healthcare through collaboration</p>
              <p>Website: <a href="https://sekondly.app" style="color: #4ECDC4;">https://sekondly.app</a></p>
            </div>
          </div>
        </div>
      `
    };

    await emailTransporter.verify();
    console.log('SMTP connection verified for rejection email');
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`Rejection email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : undefined,
      command: error instanceof Error && 'command' in error ? error.command : undefined
    });
    return false;
  }
}

async function sendCaseRejectionEmail(userEmail: string, firstName: string, lastName: string, caseTitle: string, caseId: number, rejectionReason: string) {
  try {
    const caseRejectionEmailContent = `
Dear Dr. ${firstName} ${lastName},

Thank you for submitting your case "${caseTitle}" to SeKondly. After careful review by our moderation team, we regret to inform you that we cannot approve your case for publication at this time.

Case Details:
- Case Title: ${caseTitle}
- Case ID: ${caseId}
- Submission Date: ${new Date().toLocaleDateString()}

Reason for rejection:
${rejectionReason}

We appreciate the time and effort you put into creating this case. Our moderation process ensures that all published content meets our quality and educational standards for the medical community.

What you can do next:
• Review our case submission guidelines at https://sekondly.app/static-landing.html
• Address the feedback provided and resubmit your case
• Contact our support team if you have questions about the rejection

If you believe this decision was made in error or if you have additional information to provide, please don't hesitate to contact our support team.

Thank you for your understanding and for being part of the SeKondly community.

Best regards,
The SeKondly Moderation Team

---
This email was sent to ${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    `.trim();

    const mailOptions = {
      from: `"SeKondly Team" <admin@sekondly.app>`,
      to: userEmail,
      subject: `Case Submission Update - ${caseTitle}`,
      text: caseRejectionEmailContent,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Case Submission Update - SeKondly</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 12px; }
            .header { background: linear-gradient(45deg, #dc3545, #c82333); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 0 -20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 0; font-size: 16px; opacity: 0.9; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; border-top: none; }
            .content h2 { color: #333; margin-top: 0; font-size: 24px; }
            .case-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ECDC4; }
            .case-info h3 { margin-top: 0; color: #333; font-size: 18px; }
            .case-info p { margin: 8px 0; font-size: 14px; }
            .button { display: inline-block; background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; transition: transform 0.2s ease; }
            .rejection-reason { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
            .rejection-reason h3 { margin-top: 0; color: #721c24; font-size: 18px; }
            .rejection-reason p { margin: 8px 0; color: #721c24; font-weight: 500; }
            .next-steps { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .next-steps h3 { margin-top: 0; color: #856404; }
            .next-steps ul { margin: 10px 0; padding-left: 20px; }
            .next-steps li { margin: 8px 0; color: #856404; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin: 0 -20px -20px -20px; border-top: 1px solid #e9ecef; }
            .footer p { margin: 5px 0; font-size: 14px; color: #666; }
            .footer a { color: #4ECDC4; text-decoration: none; }
            .sekondly-branding { color: #4ECDC4; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Case Submission Update</h1>
              <p>Your case submission has been reviewed</p>
            </div>
            <div class="content">
              <h2>Dear Dr. ${firstName} ${lastName},</h2>
              <p>Thank you for submitting your case "${caseTitle}" to <span class="sekondly-branding">SeKondly</span>. After careful review by our moderation team, we regret to inform you that we cannot approve your case for publication at this time.</p>
              
              <div class="case-info">
                <h3>📋 Case Details:</h3>
                <p><strong>Case Title:</strong> ${caseTitle}</p>
                <p><strong>Case ID:</strong> ${caseId}</p>
                <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Status:</strong> ❌ Not Approved</p>
              </div>
              
              <div class="rejection-reason">
                <h3>📝 Reason for rejection:</h3>
                <p>${rejectionReason}</p>
              </div>
              
              <p>We appreciate the time and effort you put into creating this case. Our moderation process ensures that all published content meets our quality and educational standards for the medical community.</p>
              
              <div class="next-steps">
                <h3><strong>What you can do next:</strong></h3>
                <ul>
                  <li>📋 Review our case submission guidelines</li>
                  <li>✏️ Address the feedback provided and resubmit your case</li>
                  <li>💬 Contact our support team if you have questions about the rejection</li>
                </ul>
              </div>
              
              <center><a href="https://sekondly.app/static-landing.html" class="button">Contact Support</a></center>
              
              <p>If you believe this decision was made in error or if you have additional information to provide, please don't hesitate to contact our support team.</p>
              <p>Thank you for your understanding and for being part of the <span class="sekondly-branding">SeKondly</span> community.</p>
              <p>Best regards,<br><strong>The <span class="sekondly-branding">SeKondly</span> Moderation Team</strong></p>
            </div>
            <div class="footer">
              <p>📧 Questions? Contact us at <a href="mailto:admin@sekondly.app">admin@sekondly.app</a></p>
              <p>🌐 Website: <a href="https://sekondly.app">https://sekondly.app</a></p>
              <p style="font-size: 12px; color: #666;">This email was sent to ${userEmail} because you submitted a case to SeKondly.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.verify();
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send case rejection email:', error);
    return false;
  }
}

async function sendCaseApprovalEmail(
  userEmail: string, 
  firstName: string, 
  lastName: string, 
  caseTitle: string, 
  caseId: number,
  verificationData?: {
    violations?: number;
    hasViolations?: boolean;
    autoRedacted?: boolean;
    confidence?: number;
  }
) {
  try {
    // Create different message based on whether there were violations
    let mainMessage = '';
    let privacySection = '';
    
    if (verificationData?.hasViolations) {
      mainMessage = `Your medical case "${caseTitle}" has been processed with automatic privacy protection and is now live on SeKondly.`;
      
      privacySection = `
🛡️ Privacy Protection Applied:
- ${verificationData.violations} privacy violations detected and automatically redacted
- Applying automatic de-identification to protect patient privacy
- Content has been safely processed using AI-powered privacy protection
- Original medical educational value preserved while ensuring HIPAA compliance

Your case underwent our advanced privacy screening and automatic redaction process to ensure patient confidentiality while maintaining its educational value.`;
    } else {
      mainMessage = `Your medical case "${caseTitle}" has been successfully approved and is now live on SeKondly.`;
      privacySection = '';
    }

    const caseApprovalEmailContent = `
Dear Dr. ${firstName} ${lastName},

Congratulations! We are pleased to inform you that ${mainMessage}

Case Details:
- Case Title: ${caseTitle}
- Case ID: ${caseId}
- Approval Date: ${new Date().toLocaleDateString()}
- Status: Published and Available to Medical Community${verificationData?.hasViolations ? '\n- Privacy Protection: ✅ Automatic de-identification applied' : ''}
${privacySection}

Your case has been reviewed by our moderation team and meets our high standards for educational content. It is now accessible to healthcare professionals worldwide and will contribute to advancing medical knowledge and collaboration.

What happens next:
• Your case is now visible to all verified medical professionals on SeKondly
• Healthcare providers can interact with your case, provide insights, and learn from your experience
• You will receive notifications when colleagues engage with your case
• Your contribution helps build our global medical knowledge database

You can view your published case and track engagement by logging into your SeKondly account at https://sekondly.app

Thank you for sharing your valuable medical expertise with the SeKondly community. Your contribution makes a real difference in advancing healthcare education and collaboration.

Best regards,
The SeKondly Moderation Team

---
This email was sent to ${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    `.trim();

    const mailOptions = {
      from: `"SeKondly Team" <admin@sekondly.app>`,
      to: userEmail,
      subject: `Case Approved - ${caseTitle} is Now Live!`,
      text: caseApprovalEmailContent,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Case Approved - SeKondly</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 12px; }
            .header { background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 0 -20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 0; font-size: 16px; opacity: 0.9; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; border-top: none; }
            .content h2 { color: #333; margin-top: 0; font-size: 24px; }
            .case-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ECDC4; }
            .case-info h3 { margin-top: 0; color: #333; font-size: 18px; }
            .case-info p { margin: 8px 0; font-size: 14px; }
            .button { display: inline-block; background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; transition: transform 0.2s ease; }
            .approval-announcement { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center; }
            .approval-announcement h3 { margin-top: 0; color: #155724; font-size: 20px; }
            .approval-announcement p { margin: 10px 0; color: #155724; font-size: 16px; }
            .next-steps { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
            .next-steps h3 { margin-top: 0; color: #155724; }
            .next-steps ul { margin: 10px 0; padding-left: 20px; }
            .next-steps li { margin: 8px 0; color: #155724; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin: 0 -20px -20px -20px; border-top: 1px solid #e9ecef; }
            .footer p { margin: 5px 0; font-size: 14px; color: #666; }
            .footer a { color: #4ECDC4; text-decoration: none; }
            .sekondly-branding { color: #4ECDC4; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Case ${verificationData?.hasViolations ? 'Processed' : 'Approved'}!</h1>
              <p>${verificationData?.hasViolations ? 'Your case has been automatically de-identified and is now live on SeKondly!' : 'Your case is now live on SeKondly!'}</p>
            </div>
            <div class="content">
              <h2>Dear Dr. ${firstName} ${lastName},</h2>
              <div class="approval-announcement">
                <h3>🎉 Congratulations! Your case has been ${verificationData?.hasViolations ? 'processed with privacy protection' : 'approved'}! 🎉</h3>
                <p>${verificationData?.hasViolations ? 'We applied automatic de-identification to protect patient privacy!' : 'We\'re excited to see your contribution to our medical community!'}</p>
              </div>
              
              <p>We are pleased to inform you that your case "${caseTitle}" has been ${verificationData?.hasViolations ? 'processed with automatic privacy protection' : 'approved'} and is now live on <span class="sekondly-branding">SeKondly</span>.</p>
              
              ${verificationData?.hasViolations ? `
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="margin-top: 0; color: #856404;">🛡️ Privacy Protection Applied</h3>
                <p style="margin: 8px 0; color: #856404;"><strong>${verificationData.violations} privacy violations detected and automatically redacted</strong></p>
                <p style="margin: 8px 0; color: #856404;">✅ Applying automatic de-identification to protect patient privacy</p>
                <p style="margin: 8px 0; color: #856404;">🔒 Content has been safely processed using AI-powered privacy protection</p>
                <p style="margin: 8px 0; color: #856404;">📚 Original medical educational value preserved while ensuring HIPAA compliance</p>
              </div>
              ` : ''}
              
              <div class="case-info">
                <h3>📋 Case Details:</h3>
                <p><strong>Case Title:</strong> ${caseTitle}</p>
                <p><strong>Case ID:</strong> ${caseId}</p>
                <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Status:</strong> ✅ Published and Available to Medical Community</p>
                ${verificationData?.hasViolations ? '<p><strong>Privacy Protection:</strong> ✅ Automatic de-identification applied</p>' : ''}
              </div>
              
              <p>Your case has been reviewed by our moderation team and meets our high standards for educational content. It is now accessible to healthcare professionals worldwide and will contribute to advancing medical knowledge and collaboration.</p>
              
              <div class="next-steps">
                <h3><strong>What happens next:</strong></h3>
                <ul>
                  <li>📱 Your case is now visible to all verified medical professionals on SeKondly</li>
                  <li>👥 Healthcare providers can interact with your case, provide insights, and learn from your experience</li>
                  <li>📧 You will receive notifications when colleagues engage with your case</li>
                  <li>📚 Your contribution helps build our global medical knowledge database</li>
                </ul>
              </div>
              
              <center><a href="https://sekondly.app" class="button">View Your Published Case</a></center>
              
              <p>You can view your published case and track engagement by logging into your SeKondly account.</p>
              <p>Thank you for sharing your valuable medical expertise with the <span class="sekondly-branding">SeKondly</span> community. Your contribution makes a real difference in advancing healthcare education and collaboration.</p>
              <p>Best regards,<br><strong>The <span class="sekondly-branding">SeKondly</span> Moderation Team</strong></p>
            </div>
            <div class="footer">
              <p>📧 Questions? Contact us at <a href="mailto:admin@sekondly.app">admin@sekondly.app</a></p>
              <p>🌐 Website: <a href="https://sekondly.app">https://sekondly.app</a></p>
              <p style="font-size: 12px; color: #666;">This email was sent to ${userEmail} because your case was approved on SeKondly.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.verify();
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send case approval email:', error);
    return false;
  }
}

import { createVerificationMiddleware, developmentConfig, productionConfig, addVerificationFlags, type VerifiedRequest } from './verification-middleware.js';
import { verifyCaseSimple } from './simple-verification.js';
import { CaseVerificationService } from './verification-service.js';

// Configuration
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const verificationConfig = isDevelopment ? developmentConfig : productionConfig;

// Enable full AI verification now that Google Cloud is configured
const useSimpleVerification = false;

// Create verification middleware (now enabled for full AI verification)
const verifyCase = createVerificationMiddleware({
  ...verificationConfig,
  enabled: true // Enabled now that Google Cloud is configured
});
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
      
      // Handle Arabic filenames properly
      let originalName = file.originalname;
      try {
        // Try to decode if it's encoded
        originalName = decodeURIComponent(originalName);
      } catch (decodeError) {
        // If decoding fails, use the original name
        console.log('Filename decoding failed, using original:', originalName);
      }
      
      // Extract file extension safely
      const ext = path.extname(originalName) || '';
      cb(null, uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    
    // Handle Arabic filenames properly
    let originalName = file.originalname;
    try {
      originalName = decodeURIComponent(originalName);
    } catch (decodeError) {
      // Use original if decoding fails
    }
    
    const extname = allowedTypes.test(path.extname(originalName).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (JPEG, PNG) and PDF files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug route to confirm routes.ts is loaded
  app.get("/api/debug-routes", (req, res) => {
    console.error("=== DEBUG ROUTE HIT - routes.ts is working! ===");
    res.status(200).json({ 
      message: "routes.ts is loaded and working",
      timestamp: new Date().toISOString(),
      routesRegistered: true
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Privacy Policy route
  app.get("/privacy", (req, res) => {
    const privacyPolicyPath = path.join(uploadDir, "privacy-policy.pdf");
    if (fs.existsSync(privacyPolicyPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="SeKondly-Privacy-Policy.pdf"');
      res.sendFile(privacyPolicyPath);
    } else {
      res.status(404).json({ error: "Privacy policy not found" });
    }
  });

  // Support ticket endpoint
  app.post("/api/support/ticket", async (req, res) => {
    try {
      // Validate request data
      const validatedData = supportTicketSchema.parse(req.body);
      
      // Generate unique ticket number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const ticketNumber = `SK-${timestamp}-${random}`;
      
      // Format email content
      const reasonLabels = {
        'question': 'Ask a Question',
        'feature': 'Request a Feature',
        'bug': 'Report a Bug'
      };
      
      const emailContent = `
New Support Request - Ticket #${ticketNumber}

Name: ${validatedData.name}
Email: ${validatedData.email}
Subject: ${validatedData.title}
Reason: ${reasonLabels[validatedData.reason]}

Message:
${validatedData.content}

---
This ticket was submitted via the SeKondly landing page on ${new Date().toLocaleString()}.
Please respond to: ${validatedData.email}
      `.trim();
      
      // Try to send email, but don't fail the request if it fails
      let emailSent = false;
      try {
        // Test if we can connect first
        await emailTransporter.verify();
        
        // Send email notification using a verified sender email
        const mailOptions = {
          from: '"SeKondly Support" <admin@sekondly.app>', // Use verified sender
          to: process.env.ADMIN_EMAIL || 'admin@sekondly.app',
          subject: `Support Request - ${ticketNumber}`,
          text: emailContent,
          replyTo: validatedData.email
        };
        
        console.log('Sending email with options:', {
          ...mailOptions,
          text: '[EMAIL CONTENT HIDDEN]'
        });
        
        await emailTransporter.sendMail(mailOptions);
        emailSent = true;
        console.log('Support ticket email sent successfully');
        
      } catch (emailError) {
        console.warn('Failed to send email notification:', emailError);
        
        // Save to a local file as backup
        const fs = require('fs');
        const ticketLogPath = path.join(process.cwd(), 'support-tickets.log');
        const logEntry = `\n\n--- Support Ticket ${ticketNumber} ---\nTimestamp: ${new Date().toISOString()}\n${emailContent}\n`;
        fs.appendFileSync(ticketLogPath, logEntry);
        console.log('Support ticket saved to local log file');
      }
      
      res.status(200).json({
        success: true,
        ticketNumber,
        message: "Support ticket submitted successfully",
        emailSent
      });
      
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to submit support ticket"
      });
    }
  });

  // User onboarding endpoint
  app.post("/api/onboarding", upload.single('credentialsFile'), async (req, res) => {
    try {
      console.log('POST /api/onboarding - Request body:', req.body);
      console.log('POST /api/onboarding - File:', req.file);
      
      const {
        firstName,
        lastName,
        email,
        password,
        boardCertification,
        level,
        yearsOfExperience,
        workplace
      } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !password || !boardCertification || !level) {
        return res.status(400).json({
          message: "Missing required fields: firstName, lastName, email, password, boardCertification, and level are required"
        });
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email address"
        });
      }
      
      // Create user data
      const userData = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        email,
        firstName,
        lastName,
        password,
        specialty: boardCertification,
        level,
        experience: yearsOfExperience || '',
        institution: workplace || '',
        phone: '', // Not collected in mobile onboarding
        isApproved: false,
        isAdmin: false,
      };
      
      // Create user in database
      const newUser = await storage.upsertUser(userData);
      console.log('POST /api/onboarding - User created:', newUser.id);
      
      // Handle credentials file upload if provided
      if (req.file) {
        try {
          // Handle Arabic filenames properly
          let originalFileName = req.file.originalname;
          try {
            originalFileName = decodeURIComponent(originalFileName);
          } catch (decodeError) {
            console.log('File name decoding failed, using original name:', originalFileName);
          }
          
          const documentData = {
            userId: newUser.id,
            fileName: originalFileName,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
          };
          
          await storage.uploadDocument(documentData);
          console.log('POST /api/onboarding - Document uploaded:', req.file.filename);
        } catch (docError) {
          console.error('Error saving document:', docError);
          // Don't fail the entire registration if document upload fails
        }
      }
      
      // Send welcome email
      try {
        await sendWelcomeEmail(email, firstName, lastName);
        console.log('POST /api/onboarding - Welcome email sent');
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail registration if email fails
      }
      
      // Return success response (excluding sensitive data)
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: "Registration successful. Your account is pending approval.",
        user: userWithoutPassword
      });
      
    } catch (error) {
      console.error("Error in onboarding:", error);
      
      // Handle duplicate email error
      if (error instanceof Error && error.message.includes('duplicate') && error.message.includes('email')) {
        return res.status(409).json({
          message: "An account with this email already exists"
        });
      }
      
      res.status(500).json({
        message: "Registration failed. Please try again."
      });
    }
  });

  // Standalone document upload endpoint
  app.post("/api/documents", isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      console.log('POST /api/documents - Request body:', req.body);
      console.log('POST /api/documents - File:', req.file);
      
      if (!req.file) {
        return res.status(400).json({
          message: "No document provided"
        });
      }
      
      const userId = req.user.id;
      
      // Handle Arabic filenames properly
      let originalFileName = req.file.originalname;
      try {
        // Try to decode if it's already encoded
        originalFileName = decodeURIComponent(originalFileName);
      } catch (decodeError) {
        // If decoding fails, use the original name as is
        console.log('File name decoding failed, using original name:', originalFileName);
      }
      
      const documentData = {
        userId: userId,
        fileName: originalFileName,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
      };
      
      const uploadedDocument = await storage.uploadDocument(documentData);
      console.log('POST /api/documents - Document uploaded:', req.file.filename);
      
      res.status(201).json({
        message: "Document uploaded successfully",
        document: uploadedDocument
      });
      
    } catch (error) {
      console.error("Error in document upload:", error);
      
      res.status(500).json({
        message: "Document upload failed. Please try again."
      });
    }
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.set('Cache-Control', 'no-store');
      console.log('GET /api/auth/user - Session user:', req.session?.user ? 'exists' : 'null');
      console.log('GET /api/auth/user - Req user:', req.user ? 'exists' : 'null');
      
      // In development, always return the authenticated user from middleware
      const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      
      if (isDevelopment && req.user) {
        return res.json(req.user);
      }
      
      const userId = req.user?.id;
      if (!userId || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For real users, fetch from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // PATCH route for updating user profile
  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      const user = await storage.updateUser(userId, updateData);
      // Update session user so GET /api/auth/user returns the latest info in development
      if (req.session) {
        req.session.user = { ...req.session.user, ...updateData };
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Profile picture upload endpoint
  app.post("/api/auth/user/profile-picture", isAuthenticated, upload.single('profilePicture'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check file type
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Only JPEG and PNG images are allowed" });
      }

      // The file has already been saved to uploads directory by multer
      // Generate the profile image URL
      const profileImageUrl = `/uploads/${req.file.filename}`;
      
      // Update user's profile image URL
      const updatedUser = await storage.updateUser(userId, { profileImageUrl });
      
      // Update session user so GET /api/auth/user returns the latest info in development
      if (req.session) {
        req.session.user = { ...req.session.user, profileImageUrl };
      }
      
      res.json({ 
        message: "Profile picture updated successfully",
        profileImageUrl,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email && !username) {
        return res.status(400).json({ message: "Email or username required" });
      }
      
      if (!password) {
        return res.status(400).json({ message: "Password required" });
      }
      
      // For development - auto-authenticate as admin
      const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        const mockUser = {
          id: "mock-user-1",
          email: email || username,
          firstName: "Dr. Admin",
          lastName: "User",
          specialty: "Administration",
          isApproved: true,
          isAdmin: true,
          profileImageUrl: null,
          phone: null,
          level: "Consultant",
          experience: "10+ years",
          institution: "Medical Center",
          createdAt: new Date(),
          updatedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: "system"
        };
        
        // Store user in session
        if (req.session) {
          req.session.user = mockUser;
        }
        
        return res.json({
          user: mockUser,
          message: "Login successful"
        });
      }
      
      // Production authentication
      try {
        const user = await storage.getUserByEmailOrUsername(email || username);
        
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Simple password check (in a real app, use proper password hashing)
        if (user.password !== password) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if user is approved and admin
        if (!user.isApproved) {
          return res.status(401).json({ message: "Account pending approval" });
        }

        if (!user.isAdmin) {
          return res.status(401).json({ message: "Admin access required" });
        }

        // Store user in session
        if (req.session) {
          req.session.user = user;
        }

        // Return user data (excluding sensitive information)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
          user: userWithoutPassword,
          message: "Login successful"
        });
      } catch (dbError) {
        console.error("Database authentication error:", dbError);
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", async (req, res) => {
    try {
      console.log('POST /api/auth/logout - Session before destroy:', req.session?.user ? 'exists' : 'null');
      
      if (req.session) {
        // Store session ID before destroying
        const sessionId = req.sessionID;
        
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Logout failed" });
          }
          console.log('Session destroyed successfully');
          
          // Clear session cookies with explicit options
          res.clearCookie('sekondly.sid', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax'
          });
          res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax'
          });
          res.clearCookie('session', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax'
          });
          
          res.json({ message: "Logout successful" });
        });
      } else {
        // Even if no session, clear cookies and return success
        console.log('No session to destroy');
        res.clearCookie('sekondly.sid', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        });
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        });
        res.clearCookie('session', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        });
        res.json({ message: "Logout successful" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Forgot password endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Validate email format
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email address is required"
        });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address"
        });
      }
      
      console.log(`Processing forgot password request for email: ${email}`);
      
      // Check if user exists
      const user = await storage.getUserByEmailOrUsername(email);
      
      if (!user) {
        // For security reasons, don't reveal if user exists or not
        return res.json({
          success: true,
          message: "If an account with this email exists, a password reset request has been sent to our support team."
        });
      }
      
      // Send forgot password email to admin
      try {
        const emailSent = await sendForgotPasswordEmail(email, user.firstName || 'User', user.lastName || '');
        
        if (emailSent) {
          console.log(`Forgot password notification sent to admin for user: ${email}`);
        } else {
          console.error(`Failed to send forgot password notification for user: ${email}`);
        }
      } catch (emailError) {
        console.error('Error sending forgot password notification:', emailError);
        // Don't fail the request if email fails
      }
      
      res.json({
        success: true,
        message: "Your password reset request has been received. Our support team will contact you directly at your registered email address to assist with resetting your password."
      });
      
    } catch (error) {
      console.error("Error processing forgot password request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process password reset request. Please try again."
      });
    }
  });

  // Delete account endpoint
  app.delete("/api/delete-account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log(`DELETE /api/delete-account - Deleting account for user: ${userId}`);
      
      // Delete all user data using the comprehensive deleteUser function
      await storage.deleteUser(userId);
      
      // Destroy the session after successful deletion
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Error destroying session after account deletion:", err);
            // Continue anyway since account was deleted
          }
        });
      }
      
      // Clear session cookies
      res.clearCookie('sekondly.sid', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax'
      });
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax'
      });
      res.clearCookie('session', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax'
      });
      
      console.log(`DELETE /api/delete-account - Account deleted successfully for user: ${userId}`);
      res.json({ 
        message: "Account deleted successfully",
        success: true 
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ 
        message: "Failed to delete account",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Add auth check endpoint for compatibility
  app.get("/api/auth/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ authenticated: false });
      }
      
      res.json({ authenticated: true, userId });
    } catch (error) {
      console.error("Error checking auth:", error);
      res.status(500).json({ authenticated: false });
    }
  });

  // Debug endpoint to check session status (development only)
  app.get("/api/auth/debug-session", async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: "Not found" });
    }
    
    res.json({
      hasSession: !!req.session,
      hasUser: !!req.session?.user,
      sessionID: req.sessionID,
      cookies: req.headers.cookie,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  });

  // Get all cases
  app.get("/api/cases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      // In development, show all cases (approved and pending)
      // In production, only show approved cases
      const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      const approvedOnly = !isDevelopment;
      
      console.log('GET /api/cases - isDevelopment:', isDevelopment, 'approvedOnly:', approvedOnly);
      
      const cases = await storage.getCases(userId, approvedOnly);
      console.log('GET /api/cases - Found cases:', cases.length);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  // Get single case by ID
  app.get("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      console.log("GET /api/cases/:id - Raw ID:", req.params.id);
      const caseId = parseInt(req.params.id);
      console.log("GET /api/cases/:id - Parsed ID:", caseId);
      
      if (isNaN(caseId)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      
      const case_data = await storage.getCase(caseId);
      if (!case_data) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(case_data);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  // Create new case
  app.post("/api/cases", isAuthenticated, upload.array("images", 5), async (req: VerifiedRequest, res) => {
    try {
      console.log('POST /api/cases - Request body:', req.body);
      console.log('POST /api/cases - Files:', req.files);
      
      const files = req.files as Express.Multer.File[];
      let imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];
      
      // Validate format - explicitly check for 'long' or default to 'short'
      const format = req.body.format === 'long' ? 'long' : 'short';
      console.log('POST /api/cases - Format:', format);
      
      // Validate common required fields
      if (!req.body.title || !req.body.specialty || !req.body.history) {
        return res.status(400).json({
          message: "Failed to create case",
          error: "Title, specialty, and history are required for all cases"
        });
      }

      // Additional validation for long format
      if (format === 'long') {
        if (!req.body.chiefComplaint || !req.body.historyOfPresentIllness) {
          return res.status(400).json({
            message: "Failed to create case",
            error: "For long cases, chief complaint and history of present illness are required"
          });
        }
        // Log long case fields for debugging
        console.log('POST /api/cases - Long case fields:', {
          chiefComplaint: req.body.chiefComplaint,
          historyOfPresentIllness: req.body.historyOfPresentIllness,
          format: format
        });
      }

      // Log all relevant fields from the request
      console.log('POST /api/cases - Raw request body:', {
        title: req.body.title,
        format: req.body.format,
        history: req.body.history,
        specialty: req.body.specialty,
        chiefComplaint: req.body.chiefComplaint,
        historyOfPresentIllness: req.body.historyOfPresentIllness,
        pastMedicalHistory: req.body.pastMedicalHistory,
        familyHistory: req.body.familyHistory,
        drugHistory: req.body.drugHistory,
        systemicReview: req.body.systemicReview,
        examination: req.body.examination,
        management: req.body.management
      });

      // Prepare case data based on format
      const baseCaseData = {
        title: req.body.title,
        history: req.body.history,
        specialty: req.body.specialty,
        imageUrls,
        format, // Always include the validated format
        authorId: req.user?.id || "mock-user-1",
      };

      // Create type-safe case data
      let caseData = format === 'long' 
        ? {
            ...baseCaseData,
            format: 'long' as const,
            chiefComplaint: req.body.chiefComplaint,
            historyOfPresentIllness: req.body.historyOfPresentIllness,
            pastMedicalHistory: req.body.pastMedicalHistory || null,
            familyHistory: req.body.familyHistory || null,
            drugHistory: req.body.drugHistory || null,
            systemicReview: req.body.systemicReview || null,
            examination: req.body.examination || null,
            management: req.body.management || null,
          }
        : {
            ...baseCaseData,
            format: 'short' as const,
          };

      // Add verification data if available
      if (req.verificationResult) {
        caseData = addVerificationFlags(caseData, req.verificationResult);
        console.log(`🔍 Added verification data: status=${(caseData as any).verificationStatus}, confidence=${(caseData as any).verificationConfidence}%`);
      }
      
      console.log('POST /api/cases - Parsed case data:', caseData);
      
      // Run verification (simple or full AI)
      if (useSimpleVerification) {
        try {
          const imagePaths = files ? files.map(file => file.path) : [];
          const verificationResult = await verifyCaseSimple(
            caseData,
            imagePaths,
            { enabled: true, logOnly: true, notifyAdmins: true }
          );
          
          console.log(`🔍 Simple Verification result: ${verificationResult.summary}`);
          
        } catch (verificationError) {
          console.error('⚠️ Simple verification failed:', verificationError);
          // Continue with case creation even if verification fails
        }
      } else {
        // Run full AI verification with Google Cloud
        try {
          console.log('🤖 Running full AI verification with Google Cloud...');
          
          // Initialize verification service with Google Cloud credentials
          const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
          const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
          
          if (!projectId) {
            throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
          }
          
          const verificationService = new CaseVerificationService(projectId, keyFilename);
          const imagePaths = files ? files.map(file => file.path) : [];
          
          // Extract text content from case data (handle both short and long formats)
          const textContent = [
            caseData.title,
            caseData.history,
            (caseData as any).chiefComplaint,
            (caseData as any).examination,
            (caseData as any).historyOfPresentIllness,
            (caseData as any).pastMedicalHistory,
            (caseData as any).management
          ].filter(Boolean).join('\n\n');
          
          const verificationResult = await verificationService.verifyCaseContent(
            textContent,
            imagePaths,
            {} // Use default verification options
          );
          
          console.log(`🔍 AI Verification result: Valid=${verificationResult.isValid}`);
          console.log(`📊 Confidence: ${verificationResult.confidence}%`);
          console.log(`⚠️ Violations: ${verificationResult.violations.length}`);
          
          if (verificationResult.violations.length > 0) {
            console.log('🚨 Privacy violations detected:');
            verificationResult.violations.forEach((violation: any, index: number) => {
              console.log(`  ${index + 1}. ${violation.type} (${violation.severity}): ${violation.description}`);
            });
            
            // 🔒 AUTOMATIC DE-IDENTIFICATION 🔒
            console.log('🛡️ Applying automatic de-identification...');
            try {
              const { FinalDeidentificationService } = await import('./final-deidentification-service.js');
              const deidentificationService = new FinalDeidentificationService(projectId, keyFilename);
              
              // Apply smart redaction to protect privacy
              const deidentificationResult = await deidentificationService.processCase(
                textContent,
                imagePaths,
                { 
                  detectOnly: false,
                  redactText: true,
                  blurImages: true,
                  redactionStyle: 'smart'
                }
              );
              
              if ('deidentification' in deidentificationResult && deidentificationResult.deidentification) {
                console.log('✅ Text de-identification successful');
                console.log(`📊 Applied ${deidentificationResult.deidentification.redactionsSummary.totalRedactions} redactions`);
                
                // Update case data with redacted content
                const redactedLines = deidentificationResult.deidentification.redactedText.split('\n\n');
                let lineIndex = 0;
                
                if (caseData.title && lineIndex < redactedLines.length) {
                  caseData.title = redactedLines[lineIndex++];
                }
                if (caseData.history && lineIndex < redactedLines.length) {
                  caseData.history = redactedLines[lineIndex++];
                }
                if ((caseData as any).chiefComplaint && lineIndex < redactedLines.length) {
                  (caseData as any).chiefComplaint = redactedLines[lineIndex++];
                }
                if ((caseData as any).examination && lineIndex < redactedLines.length) {
                  (caseData as any).examination = redactedLines[lineIndex++];
                }
                if ((caseData as any).historyOfPresentIllness && lineIndex < redactedLines.length) {
                  (caseData as any).historyOfPresentIllness = redactedLines[lineIndex++];
                }
                if ((caseData as any).pastMedicalHistory && lineIndex < redactedLines.length) {
                  (caseData as any).pastMedicalHistory = redactedLines[lineIndex++];
                }
                if ((caseData as any).management && lineIndex < redactedLines.length) {
                  (caseData as any).management = redactedLines[lineIndex++];
                }
                
                // 🖼️ AUTOMATIC IMAGE BLURRING 🖼️
                if (deidentificationResult.deidentification.redactedImages && 
                    deidentificationResult.deidentification.redactedImages.length > 0) {
                  
                  console.log('🖼️ Processing blurred images...');
                  const blurredImageUrls: string[] = [];
                  
                  for (const redactedImage of deidentificationResult.deidentification.redactedImages) {
                    console.log(`🔄 Processed image: ${redactedImage.originalPath}`);
                    console.log(`  - Faces blurred: ${redactedImage.facesBlurred}`);
                    console.log(`  - Text regions blurred: ${redactedImage.textRegionsBlurred}`);
                    
                    // Convert file path to URL for the blurred image
                    const filename = redactedImage.redactedPath.split('/').pop();
                    const blurredUrl = `/uploads/${filename}`;
                    blurredImageUrls.push(blurredUrl);
                  }
                  
                  // Update imageUrls with blurred versions
                  if (blurredImageUrls.length > 0) {
                    imageUrls = blurredImageUrls;
                    // ✅ CRITICAL FIX: Update caseData.imageUrls too!
                    caseData.imageUrls = blurredImageUrls;
                    console.log(`🔒 Replaced ${blurredImageUrls.length} images with blurred versions`);
                    console.log(`📝 Updated case data with blurred URLs:`, blurredImageUrls);
                  }
                }
                
                console.log('🔒 Case content automatically de-identified');
              } else {
                console.log('ℹ️ No redaction needed - case passed verification');
              }
            } catch (deidentificationError) {
              console.error('⚠️ De-identification failed:', deidentificationError);
              console.log('📝 Case will be flagged for manual review');
            }
          }
          
          // Add verification data to case
          caseData = addVerificationFlags(caseData, verificationResult);
          
        } catch (verificationError) {
          console.error('⚠️ AI verification failed:', verificationError);
          console.log('🔄 Falling back to simple verification...');
          
          // Fallback to simple verification if AI fails
          try {
            const imagePaths = files ? files.map(file => file.path) : [];
            const verificationResult = await verifyCaseSimple(
              caseData,
              imagePaths,
              { enabled: true, logOnly: true, notifyAdmins: true }
            );
            console.log(`🔍 Fallback verification result: ${verificationResult.summary}`);
          } catch (fallbackError) {
            console.error('⚠️ Fallback verification also failed:', fallbackError);
          }
        }
      }
      
      const newCase = await storage.createCase(caseData);
      
      // Fetch full case details with author info
      const caseWithDetails = await storage.getCase(newCase.id);
      console.log('POST /api/cases - Created case:', caseWithDetails);
      res.json(caseWithDetails);
    } catch (error) {
      console.error("Error creating case:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create case", error: errorMessage });
    }
  });

  // Get user's cases
  app.get("/api/my-cases", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || "mock-user-1";
      const cases = await storage.getUserCases(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching user cases:", error);
      res.status(500).json({ message: "Failed to fetch user cases" });
    }
  });

  // Like/unlike case
  app.post("/api/cases/:id/like", isAuthenticated, async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      
      const existingLike = await storage.getCaseLike(caseId, userId);
      if (existingLike) {
        await storage.unlikeCase(caseId, userId);
        res.json({ message: "Case unliked", favorited: false });
      } else {
        const like = await storage.likeCase(caseId, userId);
        
        // Send notification to case author (if different from liker)
        try {
          const caseDetails = await storage.getCase(caseId);
          const user = await storage.getUser(userId);
          
          if (caseDetails && user && caseDetails.authorId !== userId) {
            const likerName = `${user.firstName} ${user.lastName}`.trim() || user.email || 'Someone';
            await notificationService.sendCaseLikeNotification(
              caseDetails.authorId,
              likerName,
              caseDetails.title,
              caseId
            );
          }
        } catch (notificationError) {
          console.error("Error sending like notification:", notificationError);
          // Don't fail the like action if notification fails
        }
        
        res.json({ ...like, favorited: true });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Add comment to case
  app.post("/api/cases/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      
      const commentData = insertCommentSchema.parse({
        content: req.body.content,
        caseId,
        userId,
      });
      
      const comment = await storage.addComment(commentData);
      
      console.log(`📝 Comment created successfully:`);
      console.log(`  - Comment ID: ${comment.id}`);
      console.log(`  - Case ID: ${comment.caseId}`);
      console.log(`  - Author: ${comment.author.firstName} ${comment.author.lastName}`);
      console.log(`  - Content: "${comment.content}"`);
      
      // Send notification to case author (if different from commenter)
      try {
        const caseDetails = await storage.getCase(caseId);
        const user = await storage.getUser(userId);
        
        console.log(`🔍 Comment notification debug:`);
        console.log(`  - Case ID: ${caseId}`);
        console.log(`  - Commenter ID: ${userId}`);
        console.log(`  - Case Author ID: ${caseDetails?.authorId}`);
        console.log(`  - Commenter Name: ${user?.firstName} ${user?.lastName} (${user?.email})`);
        
        if (caseDetails && user && caseDetails.authorId !== userId) {
          console.log(`  ✅ Sending notification to case owner: ${caseDetails.authorId}`);
          const commenterName = `${user.firstName} ${user.lastName}`.trim() || user.email || 'Someone';
          await notificationService.sendCaseCommentNotification(
            caseDetails.authorId,
            commenterName,
            caseDetails.title,
            caseId
          );
        } else {
          console.log(`  ❌ Not sending notification - Same user or missing data`);
          console.log(`    - Case exists: ${!!caseDetails}`);
          console.log(`    - User exists: ${!!user}`);
          console.log(`    - Different users: ${caseDetails?.authorId !== userId}`);
        }
      } catch (notificationError) {
        console.error("Error sending comment notification:", notificationError);
        // Don't fail the comment action if notification fails
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get comments for case
  app.get("/api/cases/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      const comments = await storage.getCaseComments(caseId, userId);
      
      console.log(`📋 Fetching comments for case ${caseId}:`);
      console.log(`  - Requesting user: ${userId}`);
      console.log(`  - Found ${comments.length} comments`);
      comments.forEach((comment, index) => {
        console.log(`  - Comment ${index + 1}: "${comment.content}" by ${comment.author.firstName} ${comment.author.lastName} (${comment.userId})`);
      });
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Agree/disagree with comment
  app.post("/api/comments/:id/agree", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      
      // Check if the user already agreed with this comment
      const existingAgree = await storage.getCommentAgree(commentId, userId);
      
      if (existingAgree) {
        // User already agreed, so disagree (remove the agreement)
        await storage.disagreeWithComment(commentId, userId);
        console.log(`User ${userId} disagreed with comment ${commentId}`);
        
        // Get updated count
        const agreers = await storage.getCommentAgreers(commentId);
        
        res.json({ 
          success: true, 
          isAgreedByUser: false, 
          agreesCount: agreers.length
        });
      } else {
        // User hasn't agreed yet, so add agreement
        await storage.agreeWithComment(commentId, userId);
        console.log(`User ${userId} agreed with comment ${commentId}`);
        
        // Send notification to comment author (if different from agreeer)
        try {
          const comment = await storage.getCommentById(commentId);
          const user = await storage.getUser(userId);
          
          if (comment && user && comment.userId !== userId) {
            const agreerName = `${user.firstName} ${user.lastName}`.trim() || user.email || 'Someone';
            await notificationService.sendCommentAgreeNotification(
              comment.userId,
              agreerName,
              comment.content.slice(0, 50) + (comment.content.length > 50 ? '...' : ''),
              commentId
            );
          }
        } catch (notificationError) {
          console.error("Error sending agree notification:", notificationError);
          // Don't fail the agree action if notification fails
        }
        
        // Get updated count
        const agreers = await storage.getCommentAgreers(commentId);
        
        res.json({ 
          success: true, 
          isAgreedByUser: true, 
          agreesCount: agreers.length
        });
      }
    } catch (error) {
      console.error("Error agreeing with comment:", error);
      res.status(500).json({ message: "Failed to agree with comment" });
    }
  });

  // Get users who agreed with a comment
  app.get("/api/comments/:id/agrees", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      
      // Get actual users who agreed with this comment
      const agreers = await storage.getCommentAgreers(commentId);
      
      console.log(`Fetching ${agreers.length} users who agreed with comment ${commentId}`);
      
      res.json({ 
        success: true,
        agreers: agreers,
        count: agreers.length
      });
    } catch (error) {
      console.error("Error fetching comment agreers:", error);
      res.status(500).json({ message: "Failed to fetch comment agreers" });
    }
  });

  // Delete comment
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      
      // Get comment to check if user is the author
      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user is the author of the comment
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      
      // Delete the comment
      await storage.deleteComment(commentId);
      
      console.log(`🗑️ Comment deleted successfully:`);
      console.log(`  - Comment ID: ${commentId}`);
      console.log(`  - Deleted by: ${userId}`);
      console.log(`  - Original content: "${comment.content}"`);
      
      res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Favorite/unfavorite case
  app.post("/api/cases/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      
      const existingFavorite = await storage.getCaseFavorite(caseId, userId);
      if (existingFavorite) {
        await storage.unfavoriteCase(caseId, userId);
        res.json({ message: "Case unfavorited", favorited: false });
      } else {
        const favorite = await storage.favoriteCase(caseId, userId);
        res.json({ ...favorite, favorited: true });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Get user's favorites
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || "mock-user-1";
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Update case (only by author)
  app.put("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      console.log("PUT /api/cases/:id - Request received for case ID:", req.params.id);
      const caseId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      
      // Check if user is the author of the case
      const existingCase = await storage.getCase(caseId);
      if (!existingCase) {
        console.log("PUT /api/cases/:id - Case not found:", caseId);
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (existingCase.authorId !== userId) {
        console.log("PUT /api/cases/:id - Not authorized:", userId, "vs", existingCase.authorId);
        return res.status(403).json({ message: "Not authorized to edit this case" });
      }
      
      const { title, history, specialty } = req.body;
      if (!title || !history || !specialty) {
        return res.status(400).json({ message: "Title, history, and specialty are required" });
      }
      
      const updatedCase = await storage.updateCase(caseId, { title, history, specialty });
      console.log("PUT /api/cases/:id - Case updated successfully:", caseId);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ message: "Failed to update case" });
    }
  });

  // Delete case (only by author)
  app.delete("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      console.log("DELETE /api/cases/:id - Request received for case ID:", req.params.id);
      const caseId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      
      // Check if user is the author of the case
      const existingCase = await storage.getCase(caseId);
      if (!existingCase) {
        console.log("DELETE /api/cases/:id - Case not found:", caseId);
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (existingCase.authorId !== userId) {
        console.log("DELETE /api/cases/:id - Not authorized:", userId, "vs", existingCase.authorId);
        return res.status(403).json({ message: "Not authorized to delete this case" });
      }
      
      // Delete associated files
      if (existingCase.imageUrls && existingCase.imageUrls.length > 0) {
        for (const imageUrl of existingCase.imageUrls) {
          const filename = path.basename(imageUrl);
          const filePath = path.join(uploadDir, filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("DELETE /api/cases/:id - Deleted file:", filename);
          }
        }
      }
      
      await storage.deleteCase(caseId);
      console.log("DELETE /api/cases/:id - Case deleted successfully:", caseId);
      res.json({ message: "Case deleted successfully" });
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ message: "Failed to delete case" });
    }
  });

  // Remove image from case (only by author)
  app.delete("/api/cases/:id/images", isAuthenticated, async (req, res) => {
    try {
      console.log("DELETE /api/cases/:id/images - Request received for case ID:", req.params.id);
      const caseId = parseInt(req.params.id);
      const userId = req.user?.id || "mock-user-1";
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }
      
      // Check if user is the author of the case
      const existingCase = await storage.getCase(caseId);
      if (!existingCase) {
        console.log("DELETE /api/cases/:id/images - Case not found:", caseId);
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (existingCase.authorId !== userId) {
        console.log("DELETE /api/cases/:id/images - Not authorized:", userId, "vs", existingCase.authorId);
        return res.status(403).json({ message: "Not authorized to modify this case" });
      }
      
      // Check if image exists in case
      if (!existingCase.imageUrls || !existingCase.imageUrls.includes(imageUrl)) {
        return res.status(404).json({ message: "Image not found in case" });
      }
      
      // Remove image from filesystem
      const filename = path.basename(imageUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("DELETE /api/cases/:id/images - Deleted file:", filename);
      }
      
      // Update case to remove image URL
      const updatedImageUrls = existingCase.imageUrls.filter((url: string) => url !== imageUrl);
      const updatedCase = await storage.updateCase(caseId, { 
        imageUrls: updatedImageUrls 
      });
      
      console.log("DELETE /api/cases/:id/images - Image removed successfully from case:", caseId);
      res.json({ message: "Image removed successfully", case: updatedCase });
    } catch (error) {
      console.error("Error removing image:", error);
      res.status(500).json({ message: "Failed to remove image" });
    }
  });

  // === ADMIN VERIFICATION ROUTES ===
  // TODO: Implement these routes once storage methods are added

  /*
  // Get verification statistics
  app.get('/api/admin/verification/stats', async (req, res) => {
    try {
      const stats = await storage.getVerificationStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching verification stats:", error);
      res.status(500).json({ message: "Failed to fetch verification stats" });
    }
  });

  // Get cases flagged for review
  app.get('/api/admin/verification/flagged-cases', async (req, res) => {
    try {
      const flaggedCases = await storage.getFlaggedCases();
      res.json(flaggedCases);
    } catch (error) {
      console.error("Error fetching flagged cases:", error);
      res.status(500).json({ message: "Failed to fetch flagged cases" });
    }
  });

  // Get all cases with verification data
  app.get('/api/admin/verification/all-cases', async (req, res) => {
    try {
      const allCases = await storage.getAllCasesWithVerification();
      res.json(allCases);
    } catch (error) {
      console.error("Error fetching all verification cases:", error);
      res.status(500).json({ message: "Failed to fetch verification cases" });
    }
  });

  // Manual approval of flagged case
  app.post('/api/admin/verification/approve/:id', async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = req.user?.id || "mock-admin-1";
      
      const updatedCase = await storage.approveVerificationCase(caseId, adminId, notes);
      
      console.log(`✅ Case ${caseId} manually approved by admin ${adminId}`);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error approving verification case:", error);
      res.status(500).json({ message: "Failed to approve case" });
    }
  });

  // Manual rejection of flagged case
  app.post('/api/admin/verification/reject/:id', async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = req.user?.id || "mock-admin-1";
      
      await storage.rejectVerificationCase(caseId, adminId, notes);
      
      console.log(`❌ Case ${caseId} manually rejected by admin ${adminId}`);
      res.json({ success: true, message: "Case rejected successfully" });
    } catch (error) {
      console.error("Error rejecting verification case:", error);
      res.status(500).json({ message: "Failed to reject case" });
    }
  });
  */

  // === END ADMIN VERIFICATION ROUTES ===

  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }

      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Register notification token
  app.post("/api/notifications/register-token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { token, platform } = req.body;
      
      if (!token || !platform) {
        return res.status(400).json({ message: "Token and platform are required" });
      }

      if (!['ios', 'android'].includes(platform)) {
        return res.status(400).json({ message: "Platform must be 'ios' or 'android'" });
      }

      await notificationService.registerToken(userId, token, platform);
      res.json({ message: "Token registered successfully" });
    } catch (error) {
      console.error("Error registering notification token:", error);
      res.status(500).json({ message: "Failed to register notification token" });
    }
  });

  // Update notification preferences
  app.put("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const preferences = req.body;
      
      await notificationService.updatePreferences(userId, preferences);
      res.json({ message: "Preferences updated successfully" });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Get notification preferences
  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const preferences = await notificationService.getPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  // Test notification endpoint (for development)
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/notifications/test", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user?.id;
        const { title, body, type } = req.body;
        
        await notificationService.sendNotification(
          [userId],
          title || "Test Notification",
          body || "This is a test notification from SeKondly",
          { test: true },
          type || "general"
        );
        
        res.json({ message: "Test notification sent successfully" });
      } catch (error) {
        console.error("Error sending test notification:", error);
        res.status(500).json({ message: "Failed to send test notification" });
      }
    });
  }

  // === ADMIN PANEL ENDPOINTS ===
  
  // Admin endpoints for user approval
  app.get("/api/admin/pending-users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/admin/approve-user/:id", isAuthenticated, isAdmin, async (req, res) => {
    console.log('🔥 APPROVAL ENDPOINT HIT!!!');
    try {
      console.log('=== APPROVAL ENDPOINT CALLED ===');
      console.log('Request params:', req.params);
      console.log('Request user:', req.user);
      
      const userId = req.params.id;
      const adminId = req.user?.id || 'system';
      
      console.log('Calling storage.approveUser with:', { userId, adminId });
      const approvedUser = await storage.approveUser(userId, adminId);
      console.log('storage.approveUser returned:', approvedUser);
      
      console.log('Approved user data:', {
        id: approvedUser?.id,
        email: approvedUser?.email,
        firstName: approvedUser?.firstName,
        lastName: approvedUser?.lastName,
        hasEmail: !!approvedUser?.email,
        hasFirstName: !!approvedUser?.firstName,
        hasLastName: !!approvedUser?.lastName
      });
      
      // Send approval email
      if (approvedUser && approvedUser.email && approvedUser.firstName && approvedUser.lastName) {
        try {
          console.log(`Attempting to send approval email to: ${approvedUser.email}`);
          const emailSent = await sendApprovalEmail(
            approvedUser.email, 
            approvedUser.firstName, 
            approvedUser.lastName
          );
          console.log(`Approval email ${emailSent ? 'sent' : 'failed'} for user: ${approvedUser.email}`);
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          // Don't fail the approval if email fails
        }
      } else {
        console.log('Approval email not sent - missing required fields:', {
          hasUser: !!approvedUser,
          hasEmail: !!approvedUser?.email,
          hasFirstName: !!approvedUser?.firstName,
          hasLastName: !!approvedUser?.lastName
        });
      }
      
      res.json(approvedUser);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.delete("/api/admin/reject-user/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;
      
      if (!reason || reason.trim() === "") {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      // Get user details before deletion for email
      const userToReject = await storage.getUser(userId);
      
      if (!userToReject) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Send rejection email
      let rejectionEmailSent = false;
      if (userToReject.email && userToReject.firstName && userToReject.lastName) {
        try {
          console.log(`Attempting to send rejection email to: ${userToReject.email}`);
          rejectionEmailSent = await sendRejectionEmail(
            userToReject.email,
            userToReject.firstName,
            userToReject.lastName,
            reason.trim()
          );
          console.log(`Rejection email ${rejectionEmailSent ? 'sent' : 'failed'} for user: ${userToReject.email}`);
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
          // Continue with rejection even if email fails
        }
      }
      
      // Delete/reject the user
      await storage.rejectUser(userId);
      
      res.json({ 
        message: 'User rejected successfully',
        rejectionEmailSent,
        user: {
          id: userToReject.id,
          email: userToReject.email,
          firstName: userToReject.firstName,
          lastName: userToReject.lastName
        }
      });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // Admin endpoints for document approval
  app.get("/api/admin/pending-documents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingDocuments = await storage.getPendingDocuments();
      res.json(pendingDocuments);
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      res.status(500).json({ message: "Failed to fetch pending documents" });
    }
  });

  app.post("/api/admin/approve-document/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const adminId = req.user?.id || 'system';
      await storage.approveDocument(documentId, adminId);
      res.json({ message: 'Document approved successfully' });
    } catch (error) {
      console.error("Error approving document:", error);
      res.status(500).json({ message: "Failed to approve document" });
    }
  });

  app.delete("/api/admin/reject-document/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const adminId = req.user?.id || 'system';
      await storage.rejectDocument(documentId, adminId, "Rejected by admin");
      res.json({ message: 'Document rejected successfully' });
    } catch (error) {
      console.error("Error rejecting document:", error);
      res.status(500).json({ message: "Failed to reject document" });
    }
  });

  // Emergency admin creation endpoint (only in development or with special key)
  app.post("/api/admin/create-admin", async (req, res) => {
    try {
      // Only allow in development or with special creation key
      const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      const hasAdminKey = req.headers['x-admin-key'] === 'create-admin-sekondly-2025';
      
      if (!isDevelopment && !hasAdminKey) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const adminUser = {
        id: `admin_${Date.now()}`,
        email,
        firstName,
        lastName,
        phone: '1234567890',
        specialty: 'Administration',
        experience: '10+ years',
        institution: 'SeKondly Medical Platform',
        isApproved: true,
        isAdmin: true,
        username: email.split('@')[0],
        password,
        level: 'Administrator',
      };
      
      await storage.upsertUser(adminUser);
      
      const { password: _, ...userWithoutPassword } = adminUser;
      res.json({
        message: "Admin user created successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // === ADMIN PANEL ENDPOINTS FOR CASES ===

  // Get user documents (for admin review)
  app.get("/api/admin/user-documents/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const userDocuments = await storage.getUserDocuments(userId);
      res.json(userDocuments);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch user documents" });
    }
  });

  // Get pending cases
  app.get("/api/admin/pending-cases", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingCases = await storage.getPendingCases();
      res.json(pendingCases);
    } catch (error) {
      console.error("Error fetching pending cases:", error);
      res.status(500).json({ message: "Failed to fetch pending cases" });
    }
  });

  // Approve case
  app.post("/api/admin/approve-case/:id", isAuthenticated, isAdmin, async (req, res) => {
    console.error("=== CASE APPROVAL DEBUG START ===");
    console.error("Request ID:", req.params.id);
    
    try {
      const caseId = parseInt(req.params.id);
      const adminId = req.user?.id || 'system';
      
      console.error(`Case approval request - ID: ${caseId}, Admin: ${adminId}`);
      
      // Get case details before approval to get author info
      console.error(`Fetching case details for ID: ${caseId}`);
      const caseBeforeApproval = await storage.getCase(caseId);
      if (!caseBeforeApproval) {
        console.error(`Case approval failed: Case ${caseId} not found`);
        return res.status(404).json({ message: "Case not found" });
      }
      
      console.error(`Case found: "${caseBeforeApproval.title}" by author ${caseBeforeApproval.authorId}`);
      
      // Approve the case
      console.error(`Approving case ID: ${caseId}`);
      const approvedCase = await storage.approveCase(caseId, adminId);
      console.error(`Case ${caseId} approved successfully`);
      
      // Send approval email to case author
      try {
        console.error(`Fetching author details for ID: ${caseBeforeApproval.authorId}`);
        const caseAuthor = await storage.getUser(caseBeforeApproval.authorId);
        
        console.error('Author details:', {
          found: !!caseAuthor,
          hasEmail: !!caseAuthor?.email,
          hasFirstName: !!caseAuthor?.firstName,
          hasLastName: !!caseAuthor?.lastName,
          email: caseAuthor?.email
        });
        
        if (caseAuthor && caseAuthor.email && caseAuthor.firstName && caseAuthor.lastName) {
          console.error(`=== ABOUT TO SEND APPROVAL EMAIL ===`);
          console.error(`Email to: ${caseAuthor.email}`);
          console.error(`Case: ${caseBeforeApproval.title}`);
          
          // Extract verification data for email
          const verificationData = {
            violations: caseBeforeApproval.verificationViolations || 0,
            hasViolations: (caseBeforeApproval.verificationViolations || 0) > 0,
            autoRedacted: caseBeforeApproval.verificationStatus === 'flagged',
            confidence: caseBeforeApproval.verificationConfidence || 0
          };
          
          console.error(`Verification data for email:`, verificationData);
          
          const emailSent = await sendCaseApprovalEmail(
            caseAuthor.email,
            caseAuthor.firstName,
            caseAuthor.lastName,
            caseBeforeApproval.title,
            caseId,
            verificationData
          );
          console.error(`=== APPROVAL EMAIL RESULT: ${emailSent ? 'SUCCESS' : 'FAILED'} ===`);
        } else {
          console.error('=== APPROVAL EMAIL SKIPPED - MISSING FIELDS ===', {
            hasAuthor: !!caseAuthor,
            hasEmail: !!caseAuthor?.email,
            hasFirstName: !!caseAuthor?.firstName,
            hasLastName: !!caseAuthor?.lastName
          });
        }
      } catch (emailError) {
        console.error('=== APPROVAL EMAIL ERROR ===', emailError);
        // Don't fail the approval if email fails
      }
      
      res.json(approvedCase);
    } catch (error) {
      console.error("=== CASE APPROVAL ERROR ===", error);
      res.status(500).json({ message: "Failed to approve case" });
    }
  });

  // TEMPORARY: Test route without authentication to see if it's an auth issue
  app.post("/api/admin/test-approve-case/:id", async (req, res) => {
    console.error("=== TEST CASE APPROVAL ROUTE HIT (NO AUTH) ===");
    console.error("Request ID:", req.params.id);
    res.json({ message: "Test route working - no auth required", id: req.params.id });
  });

  // Reject case
  app.delete("/api/admin/reject-case/:id", isAuthenticated, isAdmin, async (req, res) => {
    console.error("=== CASE REJECTION DEBUG START ===");
    console.error("Request ID:", req.params.id);
    console.error("Request body:", JSON.stringify(req.body));
    
    try {
      const caseId = parseInt(req.params.id);
      const { reason } = req.body;
      
      console.error(`Case rejection request - ID: ${caseId}, Reason provided: ${!!reason}`);
      console.error(`Reason content: "${reason}"`);
      
      if (!reason || reason.trim() === "") {
        console.error('Case rejection failed: No reason provided');
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      // Get case details before deletion for email
      console.error(`Fetching case details for ID: ${caseId}`);
      const caseToReject = await storage.getCase(caseId);
      
      if (!caseToReject) {
        console.error(`Case rejection failed: Case ${caseId} not found`);
        return res.status(404).json({ message: "Case not found" });
      }
      
      console.error(`Case found: "${caseToReject.title}" by author ${caseToReject.authorId}`);
      
      // Get case author details for email
      console.error(`Fetching author details for ID: ${caseToReject.authorId}`);
      const caseAuthor = await storage.getUser(caseToReject.authorId);
      
      console.error('Author details:', {
        found: !!caseAuthor,
        hasEmail: !!caseAuthor?.email,
        hasFirstName: !!caseAuthor?.firstName,
        hasLastName: !!caseAuthor?.lastName,
        email: caseAuthor?.email
      });
      
      // Send case rejection email
      let rejectionEmailSent = false;
      if (caseAuthor?.email && caseAuthor?.firstName && caseAuthor?.lastName) {
        try {
          console.error(`=== ABOUT TO SEND EMAIL ===`);
          console.error(`Email to: ${caseAuthor.email}`);
          console.error(`Case: ${caseToReject.title}`);
          console.error(`Reason: ${reason.trim()}`);
          
          rejectionEmailSent = await sendCaseRejectionEmail(
            caseAuthor.email,
            caseAuthor.firstName,
            caseAuthor.lastName,
            caseToReject.title,
            caseId,
            reason.trim()
          );
          console.error(`=== EMAIL RESULT: ${rejectionEmailSent ? 'SUCCESS' : 'FAILED'} ===`);
        } catch (emailError) {
          console.error('=== EMAIL ERROR ===', emailError);
          // Continue with rejection even if email fails
        }
      } else {
        console.error('=== EMAIL SKIPPED - MISSING FIELDS ===', {
          hasAuthor: !!caseAuthor,
          hasEmail: !!caseAuthor?.email,
          hasFirstName: !!caseAuthor?.firstName,
          hasLastName: !!caseAuthor?.lastName
        });
      }
      
      // Delete/reject the case
      console.error(`=== DELETING CASE ID: ${caseId} ===`);
      await storage.rejectCase(caseId);
      console.error(`=== CASE ${caseId} DELETED SUCCESSFULLY ===`);
      
      res.json({ 
        message: rejectionEmailSent 
          ? 'Case rejected successfully and email sent to author'
          : 'Case rejected successfully',
        rejectionEmailSent,
        case: {
          id: caseId,
          title: caseToReject.title,
          authorEmail: caseAuthor?.email
        }
      });
    } catch (error) {
      console.error("=== CASE REJECTION ERROR ===", error);
      res.status(500).json({ message: "Failed to reject case" });
    }
  });

  // Toggle hot case status
  app.post("/api/admin/toggle-hot-case/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const { isHot } = req.body;
      const updatedCase = await storage.updateCaseHotStatus(caseId, isHot);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error toggling hot case:", error);
      res.status(500).json({ message: "Failed to toggle hot case status" });
    }
  });

  // Alternative endpoint for hot case toggle (for web and mobile compatibility)
  app.post("/api/cases/:id/hot", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      // Toggle the hot status by checking current status
      const currentCase = await storage.getCase(caseId);
      if (!currentCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      const newHotStatus = !currentCase.isHot;
      const updatedCase = await storage.updateCaseHotStatus(caseId, newHotStatus);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error toggling hot case:", error);
      res.status(500).json({ message: "Failed to toggle hot case status" });
    }
  });

  // Test endpoints for email functionality
  app.get("/api/test-smtp", async (req, res) => {
    try {
      console.log('Testing SMTP connection...');
      console.log('SMTP Config:', {
        host: 'email-smtp.eu-north-1.amazonaws.com',
        port: 587,
        user: process.env.SMTP_USER ? 'SET' : 'NOT_SET',
        pass: process.env.SMTP_PASS ? 'SET' : 'NOT_SET'
      });
      
      await emailTransporter.verify();
      res.json({ 
        success: true, 
        message: "SMTP connection verified successfully" 
      });
    } catch (error) {
      console.error('SMTP verification failed:', error);
      res.status(500).json({ 
        success: false, 
        error: "SMTP connection failed",
        details: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'code' in error ? error.code : undefined
      });
    }
  });

  // Specialty Preferences Endpoints
  
  // Save specialty preferences
  app.post("/api/specialty-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { specialties } = req.body;

      if (!specialties || !Array.isArray(specialties)) {
        return res.status(400).json({ message: "Invalid specialties provided" });
      }

      // For now, we'll store this in the user's profile or a simple storage
      // You might want to create a separate table for user preferences
      await storage.setUserSpecialtyPreferences(userId, specialties);
      
      res.json({ message: "Specialty preferences saved successfully" });
    } catch (error) {
      console.error("Error saving specialty preferences:", error);
      res.status(500).json({ message: "Failed to save specialty preferences" });
    }
  });

  // Get specialty preferences status
  app.get("/api/specialty-preferences/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const hasSetPreferences = await storage.hasUserSetSpecialtyPreferences(userId);
      
      res.json({ hasSetPreferences });
    } catch (error) {
      console.error("Error checking specialty preferences status:", error);
      res.status(500).json({ message: "Failed to check specialty preferences status" });
    }
  });

  // Get user's specialty preferences
  app.get("/api/specialty-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const preferences = await storage.getUserSpecialtyPreferences(userId);
      
      res.json(preferences || []);
    } catch (error) {
      console.error("Error fetching specialty preferences:", error);
      res.status(500).json({ message: "Failed to fetch specialty preferences" });
    }
  });

  // Test email endpoints
  app.post("/api/test-welcome-email", async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: email, firstName, lastName" 
        });
      }
      
      console.log(`Testing welcome email to: ${email}`);
      const result = await sendWelcomeEmail(email, firstName, lastName);
      
      res.json({ 
        success: true, 
        message: "Welcome email test completed",
        emailSent: result 
      });
    } catch (error) {
      console.error('Welcome email test failed:', error);
      res.status(500).json({ 
        success: false, 
        error: "Welcome email test failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/test-approval-email", async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: email, firstName, lastName" 
        });
      }
      
      console.log(`Testing approval email to: ${email}`);
      const result = await sendApprovalEmail(email, firstName, lastName);
      
      res.json({ 
        success: true, 
        message: "Approval email test completed",
        emailSent: result 
      });
    } catch (error) {
      console.error('Approval email test failed:', error);
      res.status(500).json({ 
        success: false, 
        error: "Approval email test failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/test-case-approval-email", async (req, res) => {
    try {
      const { email, firstName, lastName, caseTitle, caseId, violations, hasViolations } = req.body;
      
      if (!email || !firstName || !lastName || !caseTitle || !caseId) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: email, firstName, lastName, caseTitle, caseId" 
        });
      }
      
      // Optional verification data for testing
      const verificationData = violations || hasViolations ? {
        violations: parseInt(violations) || 0,
        hasViolations: hasViolations === 'true' || hasViolations === true,
        autoRedacted: true,
        confidence: 85
      } : undefined;
      
      console.log(`Testing case approval email to: ${email} for case: ${caseTitle}`);
      console.log(`Verification data:`, verificationData);
      const result = await sendCaseApprovalEmail(email, firstName, lastName, caseTitle, parseInt(caseId), verificationData);
      
      res.json({ 
        success: true, 
        message: "Case approval email test completed",
        emailSent: result 
      });
    } catch (error) {
      console.error('Case approval email test failed:', error);
      res.status(500).json({ 
        success: false, 
        error: "Case approval email test failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/test-forgot-password-email", async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: email, firstName, lastName" 
        });
      }
      
      console.log(`Testing forgot password email for user: ${email}`);
      const result = await sendForgotPasswordEmail(email, firstName, lastName);
      
      res.json({ 
        success: true, 
        message: "Forgot password email test completed",
        emailSent: result 
      });
    } catch (error) {
      console.error('Forgot password email test failed:', error);
      res.status(500).json({ 
        success: false, 
        error: "Forgot password email test failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}