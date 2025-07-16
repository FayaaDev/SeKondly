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
    await storage.rejectUser(userId);
    res.json({ message: 'User rejected successfully' });
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
