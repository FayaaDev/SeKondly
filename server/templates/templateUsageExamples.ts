// Template Usage Examples for SeKondly Email Templates
// Demonstrates how to use the Welcome, User Approval, and Case Approval templates

import { generateWelcomeEmail } from './welcomeEmailTemplate.js';
import { generateUserApprovalEmail } from './userApprovalTemplate.js';
import { generateCaseApprovalEmail } from './caseApprovalTemplate.js';

// Example usage for Welcome Email
export function createWelcomeEmailExample() {
  const welcomeData = {
    firstName: "Sarah",
    lastName: "Johnson",
    userEmail: "sarah.johnson@hospital.com",
    registrationDate: "December 20, 2024"
  };

  return generateWelcomeEmail(welcomeData);
}

// Example usage for User Approval Email
export function createUserApprovalEmailExample() {
  const approvalData = {
    firstName: "Michael",
    lastName: "Chen",
    userEmail: "m.chen@clinic.org",
    approvalDate: "December 21, 2024"
  };

  return generateUserApprovalEmail(approvalData);
}

// Example usage for Case Approval Email
export function createCaseApprovalEmailExample() {
  const caseApprovalData = {
    firstName: "Lisa",
    lastName: "Rodriguez",
    caseTitle: "Complex Cardiac Arrhythmia in Young Patient",
    caseId: 789,
    approvalDate: "December 22, 2024"
  };

  return generateCaseApprovalEmail(caseApprovalData);
}

// Integration example for server routes
export function integrateEmailTemplatesIntoServer() {
  return `
// In your server/routes.ts file, replace the existing email functions with these:

import { generateWelcomeEmail } from './templates/welcomeEmailTemplate.js';
import { generateUserApprovalEmail } from './templates/userApprovalTemplate.js';
import { generateCaseApprovalEmail } from './templates/caseApprovalTemplate.js';

// Welcome Email Integration
export async function sendWelcomeEmail(userData) {
  const emailContent = generateWelcomeEmail({
    firstName: userData.firstName,
    lastName: userData.lastName,
    userEmail: userData.email,
    registrationDate: userData.registrationDate
  });

  const mailOptions = {
    from: '"SeKondly Team" <admin@sekondly.app>',
    to: userData.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  };

  return transporter.sendMail(mailOptions);
}

// User Approval Email Integration
export async function sendUserApprovalEmail(userData) {
  const emailContent = generateUserApprovalEmail({
    firstName: userData.firstName,
    lastName: userData.lastName,
    userEmail: userData.email,
    approvalDate: new Date().toLocaleDateString()
  });

  const mailOptions = {
    from: '"SeKondly Team" <admin@sekondly.app>',
    to: userData.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  };

  return transporter.sendMail(mailOptions);
}

// Case Approval Email Integration (already exists)
export async function sendCaseApprovalEmail(userData, caseData) {
  const emailContent = generateCaseApprovalEmail({
    firstName: userData.firstName,
    lastName: userData.lastName,
    caseTitle: caseData.title,
    caseId: caseData.id,
    approvalDate: new Date().toLocaleDateString()
  });

  const mailOptions = {
    from: '"SeKondly Team" <admin@sekondly.app>',
    to: userData.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  };

  return transporter.sendMail(mailOptions);
}
`;
}

console.log("✅ Email Template Usage Examples Created!");
console.log("📧 All templates use the same beautiful SeKondly design");
console.log("🎨 Features: Responsive design, gradient headers, professional styling");
console.log("📱 Mobile-optimized with consistent branding");
