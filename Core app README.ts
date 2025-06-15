Core Tables:

users - Medical professionals with credentials
cases - Medical cases with approval workflow
case_likes - Like interactions
case_comments - Discussion threads
case_favorites - Saved cases
documents - Medical license uploads
notifications - Activity notifications
user_follows - Professional networking
hidden_specialties - Content filtering preferences

client/src/
├── components/          # Reusable UI components
│   ├── ui/             # Radix UI primitives
│   ├── CaseCard.tsx    # Individual case display
│   ├── NewCaseModal.tsx # Case creation form
│   └── BottomNavigation.tsx # Mobile navigation
├── pages/              # Route components
│   ├── Home.tsx        # Main feed with tabs
│   ├── AdminPanel.tsx  # Moderation interface
│   └── UserProfile.tsx # Professional profiles
├── hooks/              # Custom React hooks
└── lib/                # Utilities and config


server/
├── index.ts           # Express app setup
├── routes.ts          # API endpoint definitions
├── storage.ts         # Database operations layer
└── db.ts             # Database connection