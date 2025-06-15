# replit.md

## Overview

This is a full-stack medical case sharing platform called MedConnect, built with React frontend and Express.js backend. The application allows medical professionals to share challenging cases, collaborate through comments, and advance medical knowledge together. It features user authentication via Replit Auth, case management, document uploads, and administrative features for user approval.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds
- **UI Components**: Comprehensive shadcn/ui component library with iOS-inspired design

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer for handling image and document uploads

### Database Design
The application uses PostgreSQL with the following key tables:
- `users` - User profiles with medical professional information
- `cases` - Medical cases with images and metadata
- `case_comments` - Comments on cases
- `case_likes` - Like system for cases
- `case_favorites` - User favorites
- `documents` - Document uploads for verification
- `notifications` - User notification system
- `sessions` - Session storage for authentication

## Key Components

### Authentication System
- Mock authentication system for local development
- Direct access to all features without login requirements
- User profile management with medical credentials
- Admin approval workflow for new users (mock mode)

### Case Management
- Create, read, update, delete operations for medical cases
- Image upload support (JPEG, PNG, PDF)
- Case categorization by medical specialty
- Search and filtering capabilities
- View tracking and engagement metrics

### User Interaction Features
- Like/unlike cases
- Comment system with threaded discussions
- Favorites system for bookmarking cases
- User profiles with professional information
- Notification system for user engagement

### Administrative Features
- Admin panel for user approval
- Document verification system
- Content moderation capabilities
- User management and oversight

## Data Flow

1. **User Authentication**: Mock authentication system provides immediate access to all features
2. **Case Creation**: Users upload cases with images, stored in local filesystem with metadata in database
3. **Content Discovery**: Users browse cases with filtering by specialty, search terms, and date ranges
4. **User Interaction**: Users can like, comment, and favorite cases, with real-time updates via TanStack Query
5. **Admin Oversight**: Mock admin access for testing user and document approval workflows

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety
- **esbuild**: Server bundling for production

## Deployment Strategy

The application is configured for Replit's autoscale deployment:

- **Development**: `npm run dev` starts both frontend (Vite) and backend (Express) servers
- **Build Process**: Vite builds the frontend, esbuild bundles the server
- **Production**: Single Node.js process serves both static files and API
- **Database**: PostgreSQL 16 module for data persistence
- **Environment**: Node.js 20 runtime environment

The build output includes:
- Frontend assets in `dist/public`
- Bundled server in `dist/index.js`
- Static file serving for uploads and assets

## Changelog

- June 14, 2025: Removed Replit authentication system entirely
  - Replaced with mock authentication for local development
  - Uninstalled authentication dependencies (openid-client, passport, etc.)
  - Updated frontend routing to remove auth-based access controls
  - All features now accessible without login requirements
- June 13, 2025: Initial setup with Replit auth integration

## User Preferences

Preferred communication style: Simple, everyday language.