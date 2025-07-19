import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import nodemailer from 'nodemailer';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

// Email configuration for AWS SES  
const emailTransporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'AKIAVRCYZCTXP6X27O6Q',
    pass: process.env.SMTP_PASS || 'BAoto0SPFrFVlZPumebfgXP2JUy/0720+bW1C8EM+Tr4'
  },
  requireTLS: true
});

// Approval email function
async function sendApprovalEmail(userEmail: string, firstName: string, lastName: string) {
  try {
    console.log(`Attempting to send approval email to: ${userEmail}`);
    console.log('SMTP Config - User:', process.env.SMTP_USER ? 'SET' : 'NOT_SET');
    console.log('SMTP Config - Pass:', process.env.SMTP_PASS ? 'SET' : 'NOT_SET');
    
    await emailTransporter.verify();
    console.log('SMTP connection verified for approval email');
    
    const mailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: userEmail,
      subject: '🎉 Your SeKondly Account Has Been Approved!',
      text: `Dear Dr. ${firstName} ${lastName},

Great news! Your SeKondly account has been approved! 🎉

We're excited to see you contribute to our growing community of medical professionals!

Here's how to get started:
• Visit https://sekondly.app and sign in with your registered email and password
• Complete your profile to help colleagues find and connect with you
• Start exploring cases or share your first case with the community  
• Connect with other professionals in your field

If you need any help getting started or have questions, please visit our support page at https://sekondly.app/static-landing.html

Welcome to SeKondly!

Best regards,
The SeKondly Team

---
This email was sent to ${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app`
    };
    
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

const app = express();

// CORS configuration for mobile app development
app.use(cors({
  origin: [
    'http://localhost:3000',    // Web app
    'http://localhost:8081',    // Expo web
    'http://192.168.0.205:8081', // Expo web on network
    'http://172.20.10.3:8081', // Expo web on network
    'https://sekondly.app',     // Production domain
    'http://sekondly.app',      // Production domain (HTTP fallback)
    // Allow Expo Go app and other development origins
    /^exp:\/\/.*$/,
    /^http:\/\/192\.168\.0\.\d+:8081$/,
    /^http:\/\/172\.20\.10\.\d+:8081$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  name: 'sekondly.sid', // Custom session name
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Better security
  },
  rolling: true // Reset session timeout on each request
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email && !username) {
      return res.status(400).json({ message: "Email or username required" });
    }
    
    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }

    // Find user by email or username
    const user = await storage.getUserByEmailOrUsername(email || username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // TODO: Implement proper password hashing and verification
    // For now, we'll just check if the password matches
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Admin endpoints for user approval
app.get('/api/admin/pending-users', async (req, res) => {
  try {
    const pendingUsers = await storage.getPendingUsers();
    res.json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({ message: "Failed to fetch pending users" });
  }
});

app.post('/api/admin/approve-user/:id', async (req, res) => {
  try {
    console.log('🔥 APPROVAL ENDPOINT HIT (in index.ts)!!!');
    const userId = req.params.id;
    const adminId = req.session?.user?.id || 'system';
    const approvedUser = await storage.approveUser(userId, adminId);
    
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

app.delete('/api/admin/reject-user/:id', async (req, res) => {
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

app.get('/api/admin/pending-documents', async (req, res) => {
  try {
    const pendingDocuments = await storage.getPendingDocuments();
    res.json(pendingDocuments);
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    res.status(500).json({ message: "Failed to fetch pending documents" });
  }
});

// Admin endpoints for case management
app.get('/api/admin/pending-cases', async (req, res) => {
  try {
    const pendingCases = await storage.getPendingCases();
    res.json(pendingCases);
  } catch (error) {
    console.error("Error fetching pending cases:", error);
    res.status(500).json({ message: "Failed to fetch pending cases" });
  }
});

app.post('/api/admin/approve-case/:id', async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    const adminId = req.session?.user?.id || 'system';
    const approvedCase = await storage.approveCase(caseId, adminId);
    res.json(approvedCase);
  } catch (error) {
    console.error("Error approving case:", error);
    res.status(500).json({ message: "Failed to approve case" });
  }
});

app.delete('/api/admin/reject-case/:id', async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    await storage.rejectCase(caseId);
    res.json({ message: 'Case rejected successfully' });
  } catch (error) {
    console.error("Error rejecting case:", error);
    res.status(500).json({ message: "Failed to reject case" });
  }
});

app.post('/api/admin/toggle-hot-case/:id', async (req, res) => {
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

app.get('/api/admin/user-documents/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const userDocuments = await storage.getUserDocuments(userId);
    res.json(userDocuments);
  } catch (error) {
    console.error("Error fetching user documents:", error);
    res.status(500).json({ message: "Failed to fetch user documents" });
  }
});

// User profile and social endpoints
// Get user profile by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get follow counts and status
    const currentUserId = req.session?.user?.id;
    const [followers, following] = await Promise.all([
      storage.getUserFollowers(userId),
      storage.getUserFollowing(userId)
    ]);
    
    let isFollowedByUser = false;
    if (currentUserId) {
      const currentUserFollowing = await storage.getUserFollowing(currentUserId);
      isFollowedByUser = currentUserFollowing.some((u: any) => u.id === userId);
    }
    
    // Return public profile information with follow stats
    const publicProfile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      specialty: user.specialty,
      institution: user.institution,
      experience: user.experience,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      isApproved: user.isApproved,
      followersCount: followers.length,
      followingCount: following.length,
      isFollowedByUser
    };
    
    res.json(publicProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

// Get user's cases
app.get('/api/users/:userId/cases', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's approved cases only
    const cases = await storage.getUserCases(userId);
    const approvedCases = cases.filter((case_data: any) => case_data.isApproved);
    
    res.json(approvedCases);
  } catch (error) {
    console.error("Error fetching user cases:", error);
    res.status(500).json({ message: "Failed to fetch user cases" });
  }
});

app.get('/api/users/:userId/following', async (req, res) => {
  try {
    const userId = req.params.userId;
    const following = await storage.getUserFollowing(userId);
    res.json(following);
  } catch (error) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ message: "Failed to fetch following list" });
  }
});

app.get('/api/users/:userId/followers', async (req, res) => {
  try {
    const userId = req.params.userId;
    const followers = await storage.getUserFollowers(userId);
    res.json(followers);
  } catch (error) {
    console.error("Error fetching followers list:", error);
    res.status(500).json({ message: "Failed to fetch followers list" });
  }
});

app.get('/api/users/:userId/follow-status', async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.session?.user?.id;
    
    const [followers, following] = await Promise.all([
      storage.getUserFollowers(userId),
      storage.getUserFollowing(userId)
    ]);
    
    const followersCount = followers.length;
    const followingCount = following.length;
    
    const isFollowing = currentUserId ? await storage.isFollowing(currentUserId, userId) : false;
    
    res.json({
      isFollowing,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error("Error fetching follow status:", error);
    res.status(500).json({ message: "Failed to fetch follow status" });
  }
});

// Follow a user
app.post('/api/users/:userId/follow', async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.session?.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (currentUserId === userId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    
    await storage.followUser(currentUserId, userId);
    res.json({ message: "User followed successfully" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ message: "Failed to follow user" });
  }
});

// Unfollow a user
app.delete('/api/users/:userId/follow', async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.session?.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    await storage.unfollowUser(currentUserId, userId);
    res.json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
});

(async () => {
  try {
    // Try to register complex routes, but fallback to basic server if it fails
    let server;
    try {
      server = await registerRoutes(app);
    } catch (error: any) {
      console.log("Complex routes failed, using basic server:", error.message);
      console.error("Full error:", error);
      server = require("http").createServer(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      // Set up Vite dev server for web app development
      await setupVite(app, server);
      
      // Route for web app development
      app.get('/app*', (req, res, next) => {
        // Let Vite handle this in development
        next();
      });
      
      // Serve static landing page for root and other routes
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
          return next();
        }
        // Skip /app routes (handled by Vite)
        if (req.path.startsWith('/app')) {
          return next();
        }
        // Serve the static landing page
        res.sendFile(path.resolve(process.cwd(), 'static-landing.html'));
      });
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5001
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5001;
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port} and accessible from network`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
