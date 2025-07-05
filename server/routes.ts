import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertCommentSchema, insertDocumentSchema, User } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated, isAdmin } from "./middleware/auth";

// File upload configuration
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
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (JPEG, PNG) and PDF files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
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
          medicalBoard: null,
          fellowship: null,
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
      
      // TODO: Implement real authentication
      res.status(401).json({ message: "Invalid credentials" });
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
  app.post("/api/cases", isAuthenticated, upload.array("images", 5), async (req, res) => {
    try {
      console.log('POST /api/cases - Request body:', req.body);
      console.log('POST /api/cases - Files:', req.files);
      
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];
      
      // Parse and validate format
      const rawFormat = req.body.format;
      const format = (rawFormat === 'short' || rawFormat === 'long') ? rawFormat : 'short';
      console.log('POST /api/cases - Format:', format);

      // Validate required fields based on format
      if (!req.body.title || !req.body.specialty) {
        return res.status(400).json({
          message: "Failed to create case",
          error: "Title and specialty are required"
        });
      }

      // History is required for both formats
      if (!req.body.history) {
        return res.status(400).json({
          message: "Failed to create case",
          error: "History is required for all cases"
        });
      }

      // Additional validation for long format
      if (format === 'long') {
        if (!req.body.chiefComplaint || !req.body.historyOfPresentIllness) {
          return res.status(400).json({
            message: "Failed to create case",
            error: "Chief complaint and history of present illness are required for long format cases"
          });
        }
      }

      const caseData = {
        title: req.body.title,
        format,  // Use the validated format
        history: req.body.history,
        specialty: req.body.specialty,
        imageUrls,
        authorId: req.user?.id || "mock-user-1",
        // For long format, include all long case fields
        ...(format === 'long' && {
          chiefComplaint: req.body.chiefComplaint,
          historyOfPresentIllness: req.body.historyOfPresentIllness,
          pastMedicalHistory: req.body.pastMedicalHistory || null,
          familyHistory: req.body.familyHistory || null,
          drugHistory: req.body.drugHistory || null,
          systemicReview: req.body.systemicReview || null,
          examination: req.body.examination || null,
          management: req.body.management || null,
        })
      };
      
      console.log('POST /api/cases - Parsed case data:', caseData);
      
      const newCase = await storage.createCase(caseData);
      console.log('POST /api/cases - Created case:', newCase);
      res.json(newCase);
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
      const comments = await storage.getCaseComments(caseId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
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

  // Notifications endpoints
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || "mock-user-1";
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || "mock-user-1";
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.json({ count: 0 });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // TODO: Implement actual authentication logic
      // For now, we'll create a mock response
      const mockUser = {
        id: "mock-user-1",
        email: username,
        firstName: "John",
        lastName: "Doe",
        specialty: "Cardiology",
        isApproved: true,
        isAdmin: false,
      };

      // TODO: Generate actual JWT token
      const mockToken = "mock-jwt-token-" + Date.now();

      res.json({
        user: mockUser,
        token: mockToken,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Onboarding route
  app.post('/api/onboarding', upload.single('credentialsFile'), async (req, res) => {
    console.log('ONBOARDING ENDPOINT HIT! Request body:', req.body);
    
    try {
      const {
        firstName,
        lastName,
        phone,
        password,
        boardCertification,
        fellowship,
        yearsOfExperience,
        email
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !password) {
        return res.status(400).json({ 
          message: "First name, last name, and password are required for registration" 
        });
      }

      // Generate email if not provided
      const userEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@medical.example.com`;

      // Extract fields for logging
      const extractedFields = {
        firstName,
        lastName,
        phone,
        boardCertification,
        email: userEmail
      };
      console.log('Extracted fields:', extractedFields);

      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated user ID:', userId);

      // Create user data object with required fields
      const userData = {
        id: userId,
        email: userEmail,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        specialty: boardCertification || '',
        fellowship: fellowship || null,
        experience: yearsOfExperience || '',
        institution: null,
        medicalBoard: boardCertification || '',
        isApproved: false,
        isAdmin: false,
        password: password // Ensure password is included
      };

      console.log('User data to save:', userData);

      // Save user to database
      const user = await storage.upsertUser(userData);
      console.log('User saved successfully:', user);

      // Handle credentials file if uploaded
      if (req.file) {
        console.log('Received credentials file:', req.file.originalname);
        
        // Save document to database
        const documentData = {
          userId: userId,
          fileName: req.file.originalname,
          fileUrl: `/uploads/${req.file.filename}`,
          fileType: req.file.mimetype,
          isApproved: false
        };
        
        const document = await storage.uploadDocument(documentData);
        console.log('Document saved successfully:', document);
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Onboarding error:', error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // USER PROFILE ROUTES
  // Get user profile by ID
  app.get("/api/users/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get follow stats and relationship
      const followers = await storage.getUserFollowers(userId);
      const following = await storage.getUserFollowing(userId);
      const isFollowedByUser = followers.some((follower: any) => follower.id === currentUserId);

      const userWithStats = {
        ...user,
        followersCount: followers.length,
        followingCount: following.length,
        isFollowedByUser,
      };

      res.json(userWithStats);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Get user's published cases
  app.get("/api/users/:userId/cases", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const cases = await storage.getUserCases(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching user cases:", error);
      res.status(500).json({ message: "Failed to fetch user cases" });
    }
  });

  // Follow/unfollow user
  app.post("/api/users/:userId/follow", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user.id;
      
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already following
      const isCurrentlyFollowing = await storage.isFollowing(currentUserId, userId);
      
      if (isCurrentlyFollowing) {
        await storage.unfollowUser(currentUserId, userId);
        res.json({ isFollowing: false });
      } else {
        await storage.followUser(currentUserId, userId);
        res.json({ isFollowing: true });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to update follow status" });
    }
  });

  // Get user followers
  app.get("/api/users/:userId/followers", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getUserFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  // Get user following
  app.get("/api/users/:userId/following", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const following = await storage.getUserFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Get user follow status (for current user profile)
  app.get("/api/users/:userId/follow-status", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const followers = await storage.getUserFollowers(userId);
      const following = await storage.getUserFollowing(userId);
      const isFollowing = following.some((user: any) => user.id === currentUserId);

      res.json({
        followersCount: followers.length,
        followingCount: following.length,
        isFollowing,
      });
    } catch (error) {
      console.error("Error fetching follow status:", error);
      res.status(500).json({ message: "Failed to fetch follow status" });
    }
  });

  // ADMIN ROUTES
  // Get pending users for approval
  app.get("/api/admin/pending-users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // Get pending documents for approval
  app.get("/api/admin/pending-documents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingDocuments = await storage.getPendingDocuments();
      res.json(pendingDocuments);
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      res.status(500).json({ message: "Failed to fetch pending documents" });
    }
  });

  // Approve user
  app.post("/api/admin/approve-user/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id || "admin";
      
      await storage.approveUser(userId, adminId);
      res.json({ message: "User approved successfully" });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Reject user
  app.delete("/api/admin/reject-user/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      await storage.rejectUser(userId);
      res.json({ message: "User rejected successfully" });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // Approve document
  app.post("/api/admin/approve-document/:documentId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { documentId } = req.params;
      const adminId = req.user?.id || "admin";
      
      await storage.approveDocument(parseInt(documentId), adminId);
      res.json({ message: "Document approved successfully" });
    } catch (error) {
      console.error("Error approving document:", error);
      res.status(500).json({ message: "Failed to approve document" });
    }
  });

  // Reject document
  app.post("/api/admin/reject-document/:documentId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { documentId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || "admin";
      
      await storage.rejectDocument(parseInt(documentId), adminId, reason);
      res.json({ message: "Document rejected successfully" });
    } catch (error) {
      console.error("Error rejecting document:", error);
      res.status(500).json({ message: "Failed to reject document" });
    }
  });

  // Get admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Get user documents for admin review
  app.get("/api/admin/user-documents/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const userDocuments = await storage.getUserDocuments(userId);
      res.json(userDocuments);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch user documents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}