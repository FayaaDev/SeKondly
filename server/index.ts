import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

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
    const userId = req.params.id;
    const adminId = req.session?.user?.id || 'system';
    const approvedUser = await storage.approveUser(userId, adminId);
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
    
    const [followersCount, followingCount] = await Promise.all([
      storage.getFollowersCount(userId),
      storage.getFollowingCount(userId)
    ]);
    
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
