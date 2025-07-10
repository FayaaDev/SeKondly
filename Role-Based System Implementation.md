# Role-Based System Implementation

## Overview

This document outlines the implementation of a role-based system to support both medical doctors and dental doctors on the same platform while maintaining separate feeds and case visibility.

## Requirements

- Medical doctors and dental doctors use the same onboarding process
- Each group has different specialties
- Cases are isolated by user type (medical doctors cannot view dental cases and vice versa)
- Shared platform infrastructure with role-based content filtering

## Architecture

### User Types

The system supports two primary user types:
- `medical` - Medical doctors
- `dental` - Dental doctors

### Data Isolation Strategy

Cases and specialties are tagged with user types to ensure proper segregation while maintaining a unified platform experience.

## Implementation

### 1. Database Schema Changes

#### Users Table
```sql
-- Add user_type column to users table
ALTER TABLE users ADD COLUMN user_type ENUM('medical', 'dental') NOT NULL DEFAULT 'medical';
```

#### Cases Table
```sql
-- Add user_type column to cases table to associate cases with doctor type
ALTER TABLE cases ADD COLUMN user_type ENUM('medical', 'dental') NOT NULL DEFAULT 'medical';
```

#### Specialties Table
```sql
-- Update specialties table to include dental specialties
INSERT INTO specialties (name, user_type) VALUES 
('Orthodontics', 'dental'),
('Periodontics', 'dental'),
('Endodontics', 'dental'),
('Oral Surgery', 'dental'),
('Prosthodontics', 'dental'),
('Pediatric Dentistry', 'dental');
```

### 2. Backend API Updates

#### Case Filtering
```javascript
// GET /api/cases - Filter cases by user type
app.get('/api/cases', authenticateUser, async (req, res) => {
  try {
    const userType = req.user.user_type;
    
    // Filter cases based on user type
    const cases = await Case.find({ 
      user_type: userType,
      // ...other existing filters
    });
    
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});
```

#### Case Creation
```javascript
// POST /api/cases - Auto-assign user type to new cases
app.post('/api/cases', authenticateUser, async (req, res) => {
  try {
    const newCase = new Case({
      ...req.body,
      user_type: req.user.user_type,
      created_by: req.user.id
    });
    
    await newCase.save();
    res.json(newCase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create case' });
  }
});
```

#### Specialty Filtering
```javascript
// GET /api/specialties - Return specialties based on user type
app.get('/api/specialties', authenticateUser, async (req, res) => {
  try {
    const userType = req.user.user_type;
    const specialties = await Specialty.find({ user_type: userType });
    
    res.json(specialties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch specialties' });
  }
});
```

### 3. Frontend Implementation

#### Dashboard Component
```javascript
const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="dashboard">
      <h1>
        {user.user_type === 'dental' ? 'Dental Cases' : 'Medical Cases'}
      </h1>
      
      <CaseFeed userType={user.user_type} />
      
      {/* Conditional specialty filters */}
      <SpecialtyFilter userType={user.user_type} />
    </div>
  );
};
```

#### Registration Form
```javascript
const RegistrationForm = () => {
  const [userType, setUserType] = useState('medical');
  const [specialties, setSpecialties] = useState([]);
  
  useEffect(() => {
    // Fetch specialties based on user type
    fetchSpecialties(userType).then(setSpecialties);
  }, [userType]);
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>I am a:</label>
        <select value={userType} onChange={(e) => setUserType(e.target.value)}>
          <option value="medical">Medical Doctor</option>
          <option value="dental">Dental Doctor</option>
        </select>
      </div>
      
      <SpecialtySelector 
        specialties={specialties} 
        userType={userType}
      />
      
      {/* ...existing form fields... */}
    </form>
  );
};
```

#### Case Feed Component
```javascript
const CaseFeed = ({ userType }) => {
  const [cases, setCases] = useState([]);
  
  useEffect(() => {
    // Cases are automatically filtered by user type on the backend
    fetchCases().then(setCases);
  }, [userType]);
  
  return (
    <div className="case-feed">
      {cases.map(case => (
        <CaseCard key={case.id} case={case} />
      ))}
    </div>
  );
};
```

### 4. Authentication & Authorization

#### Middleware Updates
```javascript
// Ensure user type is included in JWT token
const generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    email: user.email,
    user_type: user.user_type
  }, process.env.JWT_SECRET);
};

// Authorization middleware for type-specific routes
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.user.user_type)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};
```

## Benefits

### Data Isolation
- Complete separation of cases by user type
- No cross-contamination between medical and dental content
- Secure access control at the database level

### Shared Infrastructure
- Single platform for both user types
- Shared authentication system
- Common UI components and workflows

### Scalability
- Easy to add new professional types (veterinarians, pharmacists, etc.)
- Extensible specialty system
- Maintainable codebase with conditional logic

### User Experience
- Tailored content for each professional group
- Relevant specialties and terminology
- Consistent onboarding experience

## Migration Strategy

### Phase 1: Database Updates
1. Add `user_type` columns to existing tables
2. Set default values for existing users
3. Create dental specialties

### Phase 2: Backend Implementation
1. Update API endpoints to filter by user type
2. Implement authentication middleware changes
3. Add validation for user type consistency

### Phase 3: Frontend Updates
1. Update registration flow
2. Implement conditional UI elements
3. Add user type-specific routing

### Phase 4: Testing & Deployment
1. Test data isolation between user types
2. Verify onboarding flows for both types
3. Conduct security audit for access controls

## Security Considerations

- All API endpoints must validate user type permissions
- Cases should never be accessible across user types
- Admin users may need special permissions to view all content
- Audit logs should track cross-type access attempts

## Future Enhancements

- Role-based permissions within user types (e.g., senior doctors, residents)
- Custom branding for different professional groups
- Type-specific notification systems
- Advanced analytics per