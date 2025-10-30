# Code Guidelines

This document outlines coding standards, linting rules, and code review guidelines to ensure consistent, maintainable, and high-quality code across the project.

## General Principles

### Code Quality Standards
1. **Readability**: Code should be self-documenting and easy to understand
2. **Consistency**: Follow established patterns and conventions
3. **Maintainability**: Write code that is easy to modify and extend
4. **Performance**: Consider performance implications of code decisions
5. **Security**: Follow security best practices and validate all inputs

### Development Philosophy
- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **SOLID Principles**: Follow object-oriented design principles
- **KISS (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones
- **YAGNI (You Aren't Gonna Need It)**: Don't implement features until needed
- **Separation of Concerns**: Keep different aspects of the application separate

## TypeScript/JavaScript Standards

### File Organization

#### Directory Structure
```
client/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── forms/          # Form-specific components
│   └── layout/         # Layout components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── store/              # Redux store and slices
├── services/           # API and external service calls
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # CSS and styling files
```

#### File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `UserTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### TypeScript Guidelines

#### Type Definitions
```typescript
// ✅ Good: Explicit interface definitions
interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Good: Union types for specific values
type UserRole = 'admin' | 'ward_officer' | 'maintenance' | 'citizen';

// ✅ Good: Generic types for reusability
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ❌ Bad: Using 'any' type
const userData: any = fetchUser();

// ✅ Good: Proper typing
const userData: User = await fetchUser();
```

#### Function Definitions
```typescript
// ✅ Good: Explicit return types
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ Good: Async function typing
const fetchUserData = async (userId: number): Promise<User> => {
  const response = await api.get<ApiResponse<User>>(`/users/${userId}`);
  return response.data.data;
};

// ✅ Good: Optional parameters
const createUser = (
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  options?: { sendWelcomeEmail: boolean }
): Promise<User> => {
  // Implementation
};
```

### Variable and Function Naming

#### Naming Conventions
```typescript
// ✅ Good: Descriptive variable names
const isUserAuthenticated = checkAuthStatus();
const complaintSubmissionDate = new Date();
const maxFileUploadSize = 5 * 1024 * 1024; // 5MB

// ❌ Bad: Unclear abbreviations
const usr = getUser();
const dt = new Date();
const max = 5000000;

// ✅ Good: Function names describe actions
const validateEmailFormat = (email: string): boolean => { /* */ };
const sendNotificationEmail = (user: User, message: string): Promise<void> => { /* */ };

// ✅ Good: Boolean variables start with is/has/can/should
const isFormValid = validateForm(formData);
const hasPermission = checkUserPermission(user, 'edit_complaints');
const canSubmitComplaint = user.role === 'citizen';
```

#### Constants
```typescript
// ✅ Good: Grouped constants
export const API_ENDPOINTS = {
  USERS: '/api/users',
  COMPLAINTS: '/api/complaints',
  AUTH: '/api/auth',
} as const;

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  WARD_OFFICER: 'ward_officer',
  MAINTENANCE: 'maintenance',
  CITIZEN: 'citizen',
} as const;
```

## React Component Guidelines

### Component Structure

#### Functional Components
```typescript
// ✅ Good: Well-structured component
interface UserProfileProps {
  userId: number;
  onUpdate?: (user: User) => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  className = '',
}) => {
  // Hooks at the top
  const { user, loading, error } = useUser(userId);
  const { t } = useTranslation();
  
  // Event handlers
  const handleUpdate = useCallback((updatedUser: User) => {
    onUpdate?.(updatedUser);
  }, [onUpdate]);
  
  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;
  
  // Main render
  return (
    <div className={`user-profile ${className}`}>
      <h2>{t('user.profile.title')}</h2>
      <UserForm user={user} onSubmit={handleUpdate} />
    </div>
  );
};
```

#### Custom Hooks
```typescript
// ✅ Good: Custom hook with proper typing
interface UseComplaintsOptions {
  userId?: number;
  status?: ComplaintStatus;
  limit?: number;
}

interface UseComplaintsReturn {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createComplaint: (data: CreateComplaintData) => Promise<Complaint>;
}

export const useComplaints = (options: UseComplaintsOptions = {}): UseComplaintsReturn => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await complaintsApi.getComplaints(options);
      setComplaints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [options]);
  
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);
  
  const createComplaint = useCallback(async (data: CreateComplaintData) => {
    const newComplaint = await complaintsApi.createComplaint(data);
    setComplaints(prev => [newComplaint, ...prev]);
    return newComplaint;
  }, []);
  
  return {
    complaints,
    loading,
    error,
    refetch: fetchComplaints,
    createComplaint,
  };
};
```

### Component Best Practices

#### Props and State Management
```typescript
// ✅ Good: Destructured props with defaults
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn--${variant}`;
  const sizeClasses = `btn--${size}`;
  const disabledClasses = disabled ? 'btn--disabled' : '';
  
  const buttonClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    disabledClasses,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};
```

#### Event Handling
```typescript
// ✅ Good: Proper event handling
const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<ComplaintFormData>(initialFormData);
  
  const handleInputChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      await onSubmit(formData);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  }, [formData, onSubmit]);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

## Backend Code Standards

### Express.js Guidelines

#### Route Structure
```javascript
// ✅ Good: Well-structured route file
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const ComplaintController = require('../controller/ComplaintController');

const router = express.Router();

// GET /api/complaints - List complaints
router.get('/',
  authenticateToken,
  ComplaintController.getComplaints
);

// POST /api/complaints - Create complaint
router.post('/',
  authenticateToken,
  [
    body('title').isLength({ min: 5, max: 200 }).trim(),
    body('description').isLength({ min: 10, max: 2000 }).trim(),
    body('category').isIn(['infrastructure', 'sanitation', 'utilities']),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
  ],
  ComplaintController.createComplaint
);

// PUT /api/complaints/:id/status - Update complaint status
router.put('/:id/status',
  authenticateToken,
  requireRole(['admin', 'ward_officer', 'maintenance']),
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['pending', 'assigned', 'in_progress', 'resolved', 'closed']),
    body('comment').optional().isLength({ max: 500 }).trim(),
  ],
  ComplaintController.updateComplaintStatus
);

module.exports = router;
```

#### Controller Structure
```javascript
// ✅ Good: Well-structured controller
const { validationResult } = require('express-validator');
const ComplaintService = require('../services/ComplaintService');
const { ApiResponse } = require('../utils/ApiResponse');
const { AppError } = require('../utils/AppError');

class ComplaintController {
  static async getComplaints(req, res, next) {
    try {
      const { page = 1, limit = 10, status, category } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const filters = {
        status,
        category,
        userId: userRole === 'citizen' ? userId : undefined,
      };
      
      const result = await ComplaintService.getComplaints({
        page: parseInt(page),
        limit: parseInt(limit),
        filters,
        userRole,
      });
      
      res.json(ApiResponse.success(result, 'Complaints retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  static async createComplaint(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, errors.array());
      }
      
      const complaintData = {
        ...req.body,
        userId: req.user.id,
      };
      
      const complaint = await ComplaintService.createComplaint(complaintData);
      
      res.status(201).json(
        ApiResponse.success(complaint, 'Complaint created successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ComplaintController;
```

#### Service Layer
```javascript
// ✅ Good: Service layer with business logic
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../utils/AppError');
const NotificationService = require('./NotificationService');

const prisma = new PrismaClient();

class ComplaintService {
  static async createComplaint(complaintData) {
    const { title, description, category, latitude, longitude, userId } = complaintData;
    
    // Create complaint in database
    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        category,
        latitude,
        longitude,
        userId,
        status: 'pending',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    // Send notification to ward officers
    await NotificationService.notifyWardOfficers(complaint);
    
    return complaint;
  }
  
  static async getComplaints({ page, limit, filters, userRole }) {
    const skip = (page - 1) * limit;
    
    // Build where clause based on user role and filters
    const where = this.buildComplaintFilters(filters, userRole);
    
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assignments: {
            include: {
              assignedTo: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);
    
    return {
      complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
  
  static buildComplaintFilters(filters, userRole) {
    const where = {};
    
    // Role-based filtering
    if (userRole === 'citizen') {
      where.userId = filters.userId;
    }
    
    // Status filtering
    if (filters.status) {
      where.status = filters.status;
    }
    
    // Category filtering
    if (filters.category) {
      where.category = filters.category;
    }
    
    return where;
  }
}

module.exports = ComplaintService;
```

## Error Handling

### Frontend Error Handling
```typescript
// ✅ Good: Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// ✅ Good: API error handling
const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
```

### Backend Error Handling
```javascript
// ✅ Good: Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// ✅ Good: Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  console.error(err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
```

## Testing Guidelines

### Unit Testing
```typescript
// ✅ Good: Component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ComplaintForm } from './ComplaintForm';

describe('ComplaintForm', () => {
  const mockOnSubmit = vi.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });
  
  it('should render all form fields', () => {
    render(<ComplaintForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    render(<ComplaintForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('should submit form with valid data', async () => {
    render(<ComplaintForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Complaint' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' },
    });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Complaint',
        description: 'Test description',
      });
    });
  });
});
```

### API Testing
```javascript
// ✅ Good: API endpoint testing
const request = require('supertest');
const app = require('../app');
const { setupTestDb, cleanupTestDb } = require('./helpers/database');

describe('Complaints API', () => {
  let authToken;
  let testUser;
  
  beforeAll(async () => {
    await setupTestDb();
    // Create test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    
    testUser = response.body.data.user;
    authToken = response.body.data.token;
  });
  
  afterAll(async () => {
    await cleanupTestDb();
  });
  
  describe('POST /api/complaints', () => {
    it('should create a new complaint', async () => {
      const complaintData = {
        title: 'Test Complaint',
        description: 'Test description',
        category: 'infrastructure',
        latitude: 12.9716,
        longitude: 77.5946,
      };
      
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${authToken}`)
        .send(complaintData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(complaintData.title);
      expect(response.body.data.userId).toBe(testUser.id);
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });
  });
});
```

## Code Review Guidelines

### Review Checklist

#### Functionality
- [ ] Code works as intended and meets requirements
- [ ] Edge cases are handled appropriately
- [ ] Error handling is comprehensive
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed

#### Code Quality
- [ ] Code is readable and well-documented
- [ ] Naming conventions are followed
- [ ] Functions are focused and do one thing well
- [ ] Code duplication is minimized
- [ ] TypeScript types are properly defined

#### Testing
- [ ] Unit tests cover the main functionality
- [ ] Integration tests validate component interactions
- [ ] Test cases cover edge cases and error scenarios
- [ ] Tests are readable and maintainable

#### Documentation
- [ ] Code is self-documenting with clear variable/function names
- [ ] Complex logic is commented
- [ ] API changes are documented
- [ ] README files are updated if needed

### Review Process

#### Before Submitting PR
1. **Self-Review**: Review your own code first
2. **Run Tests**: Ensure all tests pass
3. **Check Linting**: Fix all linting errors
4. **Update Documentation**: Update relevant documentation
5. **Write Clear Description**: Explain what the PR does and why

#### During Review
1. **Be Constructive**: Provide helpful feedback, not just criticism
2. **Explain Reasoning**: Explain why changes are needed
3. **Suggest Solutions**: Don't just point out problems, suggest fixes
4. **Consider Context**: Understand the broader context of changes
5. **Test Locally**: Test the changes in your local environment

#### Review Comments
```markdown
// ✅ Good review comment
Consider extracting this logic into a separate function for better readability and testability:

```typescript
const validateComplaintData = (data: ComplaintData): ValidationResult => {
  // validation logic here
};
```

// ❌ Bad review comment
This is wrong.

// ✅ Good review comment
This could potentially cause a memory leak. Consider using useCallback to memoize this function:

```typescript
const handleSubmit = useCallback((data) => {
  // handler logic
}, [dependency]);
```
```

## Linting and Formatting

### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

## See Also

- [Architecture Overview](./architecture_overview.md) - System architecture and design patterns
- [API Contracts](./api_contracts.md) - API design and documentation standards
- [I18n Conversion Guide](./i18n_conversion_guide.md) - Internationalization implementation
- [QA Test Cases](../QA/test_cases.md) - Testing standards and procedures
- [Onboarding Setup](../Onboarding/local_setup.md) - Development environment setup