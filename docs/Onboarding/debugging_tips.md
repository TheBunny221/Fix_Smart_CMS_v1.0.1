# Debugging Tips

This document provides common debugging workflows, troubleshooting procedures, and best practices for identifying and resolving issues in the complaint management system.

## General Debugging Principles

### Debugging Mindset
1. **Reproduce the Issue**: Ensure you can consistently reproduce the problem
2. **Isolate the Problem**: Narrow down the scope to identify the root cause
3. **Use Scientific Method**: Form hypotheses and test them systematically
4. **Document Findings**: Keep track of what you've tried and learned
5. **Ask for Help**: Don't hesitate to seek assistance when stuck

### Debugging Process
1. **Understand the Expected Behavior**: Know what should happen
2. **Identify the Actual Behavior**: Document what is actually happening
3. **Gather Information**: Collect logs, error messages, and relevant data
4. **Form Hypotheses**: Develop theories about potential causes
5. **Test Hypotheses**: Systematically test each theory
6. **Implement Solution**: Apply the fix and verify it works
7. **Document Solution**: Record the issue and resolution for future reference

## Frontend Debugging

### React Component Issues

#### Component Not Rendering
```javascript
// Check if component is being imported correctly
import { MyComponent } from './MyComponent'; // Named export
import MyComponent from './MyComponent';     // Default export

// Verify component is being used in JSX
function App() {
  return (
    <div>
      <MyComponent /> {/* Make sure component name matches */}
    </div>
  );
}

// Check for JSX syntax errors
// Common issues:
// - Missing closing tags
// - Incorrect attribute names (className vs class)
// - Missing key props in lists
```

#### State Not Updating
```javascript
// Common useState issues
const [count, setCount] = useState(0);

// ❌ Wrong: Mutating state directly
count = count + 1;

// ✅ Correct: Using setter function
setCount(count + 1);

// ❌ Wrong: Mutating object/array state
const [user, setUser] = useState({ name: 'John', age: 30 });
user.age = 31; // This won't trigger re-render

// ✅ Correct: Creating new object
setUser({ ...user, age: 31 });

// For debugging state updates
useEffect(() => {
  console.log('State updated:', count);
}, [count]);
```

#### Props Not Passing Correctly
```javascript
// Debug props in child component
function ChildComponent(props) {
  console.log('Received props:', props);
  
  // Check if specific prop exists
  if (!props.data) {
    console.warn('Missing required prop: data');
    return <div>Loading...</div>;
  }
  
  return <div>{props.data}</div>;
}

// Debug props in parent component
function ParentComponent() {
  const data = "Hello World";
  console.log('Passing data:', data);
  
  return <ChildComponent data={data} />;
}
```

### React Hooks Debugging

#### useEffect Issues
```javascript
// Debug useEffect execution
useEffect(() => {
  console.log('useEffect running');
  console.log('Dependencies:', { userId, isActive });
  
  // Your effect logic here
  
  return () => {
    console.log('useEffect cleanup');
  };
}, [userId, isActive]); // Make sure dependencies are correct

// Common useEffect issues:
// 1. Missing dependencies (ESLint will warn)
// 2. Infinite loops (missing dependency array)
// 3. Stale closures (outdated values in effect)
```

#### Custom Hook Debugging
```javascript
// Add debugging to custom hooks
function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log('useApi: Fetching data from', url);
    
    fetch(url)
      .then(response => {
        console.log('useApi: Response received', response.status);
        return response.json();
      })
      .then(data => {
        console.log('useApi: Data received', data);
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('useApi: Error occurred', error);
        setError(error);
        setLoading(false);
      });
  }, [url]);
  
  return { data, loading, error };
}
```

### Browser DevTools

#### Console Debugging
```javascript
// Different console methods
console.log('Basic logging');
console.info('Information message');
console.warn('Warning message');
console.error('Error message');

// Object inspection
console.table(arrayOfObjects);
console.dir(complexObject);

// Grouping logs
console.group('API Call');
console.log('Request:', requestData);
console.log('Response:', responseData);
console.groupEnd();

// Conditional logging
console.assert(user.id, 'User ID is missing');

// Performance timing
console.time('API Call');
// ... API call code ...
console.timeEnd('API Call');
```

#### React DevTools
1. **Install React DevTools Extension**
2. **Inspect Component Tree**: View component hierarchy and props
3. **Profile Performance**: Identify slow components
4. **Debug Hooks**: Inspect hook values and updates

#### Network Tab Debugging
1. **Monitor API Calls**: Check request/response data
2. **Inspect Headers**: Verify authentication tokens
3. **Check Status Codes**: Identify HTTP errors
4. **Analyze Timing**: Find slow requests

### CSS and Styling Issues

#### Tailwind CSS Debugging
```javascript
// Check if Tailwind classes are applied
// Use browser DevTools to inspect computed styles

// Common issues:
// 1. Purged classes (not included in build)
// 2. Conflicting styles
// 3. Incorrect class names

// Debug with explicit styles
<div className="bg-red-500 p-4 m-2 border-2 border-black">
  Debug element
</div>
```

#### Layout Issues
```css
/* Add debugging borders */
* {
  border: 1px solid red !important;
}

/* Debug flexbox */
.debug-flex {
  border: 2px solid blue;
}
.debug-flex > * {
  border: 1px solid green;
}
```

## Backend Debugging

### Node.js/Express Debugging

#### Server Startup Issues
```javascript
// Add detailed logging to server startup
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

#### API Endpoint Debugging
```javascript
// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Debug specific routes
app.get('/api/complaints', async (req, res) => {
  try {
    console.log('Fetching complaints with query:', req.query);
    
    const complaints = await getComplaints(req.query);
    console.log(`Found ${complaints.length} complaints`);
    
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### Database Query Debugging
```javascript
// Prisma query debugging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Add query logging
async function getComplaints(filters) {
  console.log('Database query filters:', filters);
  
  try {
    const complaints = await prisma.complaint.findMany({
      where: filters,
      include: {
        user: true,
        category: true,
      },
    });
    
    console.log(`Query returned ${complaints.length} results`);
    return complaints;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
```

### Authentication and Authorization Issues

#### JWT Token Debugging
```javascript
// Debug JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('No token provided');
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    
    console.log('Token verified for user:', user.id);
    req.user = user;
    next();
  });
}
```

#### Session Debugging
```javascript
// Debug session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // Set to true in production with HTTPS
}));

app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});
```

## Database Debugging

### PostgreSQL Issues

#### Connection Problems
```bash
# Test database connection
psql -U postgres -h localhost -d complaint_management -c "SELECT version();"

# Check if PostgreSQL is running
# Windows
net start postgresql-x64-15

# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

#### Query Performance
```sql
-- Enable query logging in PostgreSQL
-- Add to postgresql.conf:
-- log_statement = 'all'
-- log_duration = on
-- log_min_duration_statement = 0

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM complaints WHERE status = 'open';

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'complaints';
```

### Prisma Debugging

#### Schema Issues
```bash
# Validate Prisma schema
npx prisma validate

# Check database schema drift
npx prisma db pull

# Generate Prisma client with debug info
npx prisma generate --schema=./prisma/schema.prisma
```

#### Migration Problems
```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Resolve migration conflicts
npx prisma migrate resolve --applied "20231025_migration_name"

# Create and apply new migration
npx prisma migrate dev --name "descriptive_name"
```

## Testing and Quality Assurance

### Unit Test Debugging

#### Vitest Debugging
```javascript
// Debug test setup
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('User Service', () => {
  beforeEach(() => {
    console.log('Setting up test');
    // Reset mocks
    vi.clearAllMocks();
  });
  
  it('should create user', async () => {
    console.log('Testing user creation');
    
    const userData = { name: 'John', email: 'john@example.com' };
    console.log('Input data:', userData);
    
    const result = await createUser(userData);
    console.log('Result:', result);
    
    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
  });
});

// Run specific test with debug output
// npm test -- --reporter=verbose user.test.js
```

#### Mock Debugging
```javascript
// Debug API mocks
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Log mock calls
mockFetch.mockImplementation((url, options) => {
  console.log('Mock fetch called with:', { url, options });
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1, name: 'Test' }),
  });
});

// Check mock calls
expect(mockFetch).toHaveBeenCalledWith('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData),
});

console.log('Mock calls:', mockFetch.mock.calls);
```

### E2E Test Debugging

#### Cypress Debugging
```javascript
// cypress/e2e/complaints.cy.js
describe('Complaint Management', () => {
  beforeEach(() => {
    // Enable debug logging
    cy.visit('/complaints', { log: true });
  });
  
  it('should create complaint', () => {
    // Debug element selection
    cy.get('[data-testid="create-complaint-btn"]')
      .should('be.visible')
      .debug() // Pause execution for debugging
      .click();
    
    // Log current URL
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });
    
    // Take screenshot for debugging
    cy.screenshot('complaint-creation');
  });
});

// Run Cypress in headed mode for debugging
// npx cypress open
```

## Performance Debugging

### Frontend Performance

#### React Performance
```javascript
// Use React Profiler
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component render:', {
    id,
    phase,
    actualDuration,
  });
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <ComplaintDashboard />
    </Profiler>
  );
}

// Identify unnecessary re-renders
const MemoizedComponent = React.memo(ExpensiveComponent, (prevProps, nextProps) => {
  console.log('Checking if component should re-render');
  console.log('Previous props:', prevProps);
  console.log('Next props:', nextProps);
  
  return prevProps.id === nextProps.id;
});
```

#### Bundle Size Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for large dependencies
npm ls --depth=0 --long
```

### Backend Performance

#### API Response Time
```javascript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});
```

#### Memory Usage Monitoring
```javascript
// Monitor memory usage
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
  });
}, 30000); // Log every 30 seconds
```

## Environment and Configuration Issues

### Environment Variables
```javascript
// Debug environment configuration
console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}
```

### Configuration Validation
```javascript
// Validate configuration on startup
function validateConfig() {
  const config = {
    port: process.env.PORT || 3000,
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
  };
  
  console.log('Configuration validation:');
  
  // Check database URL format
  if (!config.dbUrl || !config.dbUrl.startsWith('postgresql://')) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  // Check JWT secret length
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  console.log('✅ Configuration is valid');
  return config;
}
```

## Common Error Patterns and Solutions

### Frontend Errors

#### "Cannot read property of undefined"
```javascript
// ❌ Problem: Accessing nested property without checking
const userName = user.profile.name;

// ✅ Solution 1: Optional chaining
const userName = user?.profile?.name;

// ✅ Solution 2: Default values
const userName = user?.profile?.name || 'Unknown';

// ✅ Solution 3: Conditional rendering
{user?.profile?.name && <div>{user.profile.name}</div>}
```

#### "Hook called outside of component"
```javascript
// ❌ Problem: Using hooks in wrong context
function handleClick() {
  const [count, setCount] = useState(0); // Wrong!
}

// ✅ Solution: Use hooks at component level
function MyComponent() {
  const [count, setCount] = useState(0);
  
  function handleClick() {
    setCount(count + 1); // Correct!
  }
}
```

#### "Maximum update depth exceeded"
```javascript
// ❌ Problem: Infinite re-render loop
function MyComponent() {
  const [count, setCount] = useState(0);
  
  setCount(count + 1); // This runs on every render!
  
  return <div>{count}</div>;
}

// ✅ Solution: Use useEffect or event handlers
function MyComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1); // Runs once after mount
  }, []); // Empty dependency array
  
  return <div>{count}</div>;
}
```

### Backend Errors

#### "Cannot set headers after they are sent"
```javascript
// ❌ Problem: Multiple responses
app.get('/api/data', (req, res) => {
  res.json({ data: 'first' });
  res.json({ data: 'second' }); // Error!
});

// ✅ Solution: Ensure single response
app.get('/api/data', (req, res) => {
  try {
    const data = getData();
    res.json({ data });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});
```

#### "Connection terminated unexpectedly"
```javascript
// ❌ Problem: Database connection issues
// ✅ Solution: Add connection retry logic
async function connectWithRetry() {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
      break;
    } catch (error) {
      retries++;
      console.error(`Database connection attempt ${retries} failed:`, error.message);
      
      if (retries === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));
    }
  }
}
```

## Debugging Tools and Utilities

### Logging Libraries
```javascript
// Winston for structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Usage
logger.info('User logged in', { userId: 123 });
logger.error('Database error', { error: error.message, stack: error.stack });
```

### Debug Package
```javascript
// Use debug package for conditional logging
const debug = require('debug')('app:complaints');

debug('Fetching complaints for user %s', userId);
debug('Query parameters: %O', queryParams);

// Enable debug output
// NODE_DEBUG=app:* npm start
```

### Error Tracking
```javascript
// Sentry for error tracking
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Capture errors
try {
  // Your code here
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

## Debugging Workflows

### Frontend Issue Workflow
1. **Reproduce the Issue**: Try to consistently reproduce the problem
2. **Check Browser Console**: Look for JavaScript errors and warnings
3. **Inspect Network Tab**: Check API calls and responses
4. **Use React DevTools**: Inspect component state and props
5. **Add Console Logs**: Add strategic logging to understand flow
6. **Check CSS**: Verify styling and layout issues
7. **Test in Different Browsers**: Ensure cross-browser compatibility

### Backend Issue Workflow
1. **Check Server Logs**: Look for error messages and stack traces
2. **Verify Environment**: Ensure all required environment variables are set
3. **Test Database Connection**: Verify database connectivity and queries
4. **Check API Endpoints**: Test endpoints with Postman or curl
5. **Add Debug Logging**: Add detailed logging to understand request flow
6. **Monitor Performance**: Check for slow queries or memory leaks
7. **Validate Input Data**: Ensure request data is properly formatted

### Full-Stack Issue Workflow
1. **Identify the Layer**: Determine if issue is frontend, backend, or database
2. **Check Network Communication**: Verify API calls are working correctly
3. **Validate Data Flow**: Ensure data is properly passed between layers
4. **Test Authentication**: Verify user authentication and authorization
5. **Check Error Handling**: Ensure errors are properly caught and handled
6. **Monitor Performance**: Check for bottlenecks across the stack

## Best Practices

### Debugging Best Practices
1. **Use Meaningful Log Messages**: Include context and relevant data
2. **Log at Appropriate Levels**: Use info, warn, error levels correctly
3. **Remove Debug Code**: Clean up console.logs before committing
4. **Use Debugging Tools**: Leverage browser DevTools and IDE debuggers
5. **Write Tests**: Create tests to prevent regressions
6. **Document Solutions**: Record fixes for future reference

### Error Handling Best Practices
```javascript
// Frontend error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    
    return this.props.children;
  }
}

// Backend error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Log error details
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id,
  });
  
  // Send appropriate response
  if (error.name === 'ValidationError') {
    res.status(400).json({ error: 'Invalid input data' });
  } else if (error.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Authentication required' });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Getting Help

### When to Ask for Help
- After spending 30+ minutes on the same issue
- When the error message is unclear or cryptic
- When the issue affects critical functionality
- When you've exhausted common debugging steps

### How to Ask for Help
1. **Provide Context**: Explain what you were trying to do
2. **Include Error Messages**: Copy the exact error message
3. **Share Relevant Code**: Include the code that's causing issues
4. **Describe Steps Taken**: List what you've already tried
5. **Include Environment Info**: OS, Node version, browser, etc.

### Resources for Help
- **Team Members**: Ask colleagues who are familiar with the codebase
- **Documentation**: Check project documentation and README files
- **Stack Overflow**: Search for similar issues and solutions
- **GitHub Issues**: Check if it's a known issue with dependencies
- **Official Documentation**: React, Node.js, PostgreSQL docs

## See Also

- [Local Setup](./local_setup.md) - Development environment setup
- [Development Tools](./development_tools.md) - Recommended tools and extensions
- [Branching Strategy](./branching_strategy.md) - Git workflow and conventions
- [Code Guidelines](../Developer/code_guidelines.md) - Coding standards and practices
- [Architecture Overview](../Developer/architecture_overview.md) - System architecture understanding
- [QA Test Cases](../QA/test_cases.md) - Testing procedures and validation