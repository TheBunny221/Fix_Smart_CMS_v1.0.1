# Complete Password Management and Recovery System

## Overview

The NLC-CMS password management system provides a comprehensive, secure solution for password operations including:

- ✅ **Secure Password Change** - In-profile password change with current password verification
- ✅ **OTP-Based Password Reset** - Email-based OTP verification for password recovery
- ✅ **Strong Password Policy** - Enforced password strength requirements
- ✅ **Email Templates** - Professional HTML email templates with dynamic content
- ✅ **Environment-Based URLs** - Dynamic URL generation using WHOST and WPORT
- ✅ **First-Time Password Setup** - Secure token-based password setup for new users
- ✅ **Comprehensive Validation** - Frontend and backend validation alignment

## Password Policy

### Requirements
All passwords must meet the following criteria:
- **Minimum Length**: 8 characters
- **Uppercase Letter**: At least one (A-Z)
- **Lowercase Letter**: At least one (a-z)
- **Number**: At least one (0-9)
- **Special Character**: At least one (!@#$%^&*(),.?\":{}|<>)

### Implementation
```javascript
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push(\"Password must contain at least one uppercase letter\");
  }
  if (!hasLowerCase) {
    errors.push(\"Password must contain at least one lowercase letter\");
  }
  if (!hasNumbers) {
    errors.push(\"Password must contain at least one number\");
  }
  if (!hasSpecialChar) {
    errors.push(\"Password must contain at least one special character\");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## API Endpoints

### Password Change (Authenticated Users)

#### `POST /api/users/change-password`
**Access**: Private (Authenticated users)

**Request Body**:
```json
{
  \"oldPassword\": \"currentPassword123!\",
  \"newPassword\": \"newSecurePassword456@\",
  \"confirmPassword\": \"newSecurePassword456@\"
}
```

**Success Response** (200):
```json
{
  \"status\": \"success\",
  \"code\": 200,
  \"message\": \"Password updated successfully\"
}
```

**Error Responses**:
- **400**: Validation errors (missing fields, password mismatch, weak password)
- **401**: Incorrect current password
- **404**: User not found
- **500**: Server error

### Password Reset Flow

#### 1. `POST /api/users/request-reset-otp`
**Access**: Public

**Request Body**:
```json
{
  \"email\": \"user@example.com\"
}
```

**Success Response** (200):
```json
{
  \"status\": \"success\",
  \"code\": 200,
  \"message\": \"OTP sent successfully\"
}
```

#### 2. `POST /api/users/verify-reset-otp`
**Access**: Public

**Request Body**:
```json
{
  \"email\": \"user@example.com\",
  \"otp\": \"123456\"
}
```

**Success Response** (200):
```json
{
  \"status\": \"success\",
  \"code\": 200,
  \"message\": \"OTP verified successfully\"
}
```

#### 3. `POST /api/users/reset-password`
**Access**: Public (requires prior OTP verification)

**Request Body**:
```json
{
  \"email\": \"user@example.com\",
  \"newPassword\": \"newSecurePassword456@\"
}
```

**Success Response** (200):
```json
{
  \"status\": \"success\",
  \"code\": 200,
  \"message\": \"Password reset successfully\"
}
```

## Frontend Implementation

### ForgotPassword Component (`client/pages/ForgotPassword.tsx`)

**Features**:
- Multi-step password reset flow (Email → OTP → New Password)
- Real-time password validation
- OTP verification modal integration
- Responsive design with proper error handling
- Toast notifications for user feedback

**Key Functions**:
```typescript
// Step 1: Request OTP
const handleRequestOTP = async (e: React.FormEvent) => {
  // Validates email and sends OTP request
};

// Step 2: Verify OTP
const handleVerifyOTP = async (data: { otpCode: string }) => {
  // Verifies OTP and proceeds to password reset
};

// Step 3: Reset Password
const handleResetPassword = async (e: React.FormEvent) => {
  // Validates and submits new password
};
```

### Profile Component (`client/pages/Profile.tsx`)

**Features**:
- Integrated password change functionality
- First-time password setup for new users
- Password strength validation
- Secure password visibility toggle
- Profile information management

**Key Functions**:
```typescript
// Change existing password
const handleChangePassword = async () => {
  // Validates current password and sets new password
};

// Setup password for new users
const handleSendPasswordSetupEmail = async () => {
  // Sends setup email for first-time password creation
};
```

## Backend Implementation

### UserController (`server/controller/userController.js`)

**Change Password Function**:
```javascript
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  // Validation
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      status: \"error\",
      code: 400,
      message: \"All fields are required\",
    });
  }

  // Password strength validation
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      status: \"error\",
      code: 400,
      message: \"Password does not meet security requirements\",
      errors: passwordValidation.errors,
    });
  }

  // Verify old password and update
  // ... implementation details
});
```

### AuthController (`server/controller/authController.js`)

**Password Reset Functions**:
```javascript
// Request OTP for password reset
export const requestResetOTP = asyncHandler(async (req, res) => {
  // Generates and sends OTP via email
});

// Verify OTP
export const verifyResetOTP = asyncHandler(async (req, res) => {
  // Validates OTP and marks session as verified
});

// Reset password
export const resetPassword = asyncHandler(async (req, res) => {
  // Updates password after OTP verification
  // Sends confirmation email
});
```

## Email Templates

### Template Structure
All email templates are stored in the `template/` directory:

- `otp-mail.html` - OTP verification email
- `welcome-mail.html` - Welcome email with password setup link
- `password-reset-success.html` - Password reset confirmation
- `complaint-status.html` - Complaint status updates

### Template Variables
Templates support dynamic variable replacement:

```html
<!-- Example template usage -->
<h1>Hello {{USERNAME}}</h1>
<p>Your OTP is: <strong>{{OTP}}</strong></p>
<a href=\"{{RESET_URL}}\">Reset Password</a>
```

### Mail Service (`server/utils/mailService.js`)

**Key Features**:
- Environment-based URL generation using WHOST and WPORT
- Template caching for performance
- Automatic fallback for missing variables
- Support for conditional blocks and loops
- SMTP configuration with retry logic

**Environment URL Generation**:
```javascript
function getEnvironmentUrls() {
  const whost = process.env.WHOST || process.env.HOST || 'localhost';
  const wport = process.env.WPORT || process.env.PORT || '4005';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  return {
    WHOST: whost,
    WPORT: wport,
    APP_URL: `${protocol}://${whost}:${wport}`,
    LOGIN_URL: `${protocol}://${whost}:${wport}/login`,
    RESET_URL: `${protocol}://${whost}:${wport}/forgot-password`,
  };
}
```

## Security Features

### Password Hashing
- Uses bcrypt with 10 salt rounds
- Passwords are never stored or logged in plain text
- Secure comparison for password verification

### OTP Security
- 6-digit numeric OTP
- 10-minute expiration time
- Single-use tokens (invalidated after verification)
- Purpose-specific OTP sessions (PASSWORD_RESET, LOGIN, etc.)

### Session Management
- JWT-based authentication
- Automatic token refresh
- Secure session invalidation

### Rate Limiting
- Configurable rate limits for API endpoints
- Protection against brute force attacks
- IP-based request throttling

## Environment Configuration

### Required Environment Variables

```bash
# Application URLs
WHOST=199.199.50.206          # Server host for email links
WPORT=4005                    # Server port for email links
CLIENT_URL=http://localhost:4005

# Email Configuration
EMAIL_SERVICE=smtp.office365.com
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
EMAIL_PORT=587
EMAIL_FROM=\"Your App Name\"

# Security
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d

# Database
DATABASE_URL=your-database-url
```

### Development vs Production

**Development**:
- Uses HTTP for local URLs
- Ethereal email for testing (if SMTP not configured)
- Detailed error messages
- Preview URLs for emails

**Production**:
- Uses HTTPS for security
- Production SMTP configuration
- Sanitized error messages
- Email logging for monitoring

## Testing Guide

### Manual Testing Steps

1. **Password Change (Authenticated User)**:
   ```bash
   # Login and get token
   curl -X POST http://localhost:4005/api/auth/login \\
     -H \"Content-Type: application/json\" \\
     -d '{\"email\":\"user@example.com\",\"password\":\"oldPassword123!\"}'
   
   # Change password
   curl -X POST http://localhost:4005/api/users/change-password \\
     -H \"Content-Type: application/json\" \\
     -H \"Authorization: Bearer YOUR_TOKEN\" \\
     -d '{
       \"oldPassword\":\"oldPassword123!\",
       \"newPassword\":\"newPassword456@\",
       \"confirmPassword\":\"newPassword456@\"
     }'
   ```

2. **Password Reset Flow**:
   ```bash
   # Step 1: Request OTP
   curl -X POST http://localhost:4005/api/users/request-reset-otp \\
     -H \"Content-Type: application/json\" \\
     -d '{\"email\":\"user@example.com\"}'
   
   # Step 2: Verify OTP (check email for OTP)
   curl -X POST http://localhost:4005/api/users/verify-reset-otp \\
     -H \"Content-Type: application/json\" \\
     -d '{\"email\":\"user@example.com\",\"otp\":\"123456\"}'
   
   # Step 3: Reset Password
   curl -X POST http://localhost:4005/api/users/reset-password \\
     -H \"Content-Type: application/json\" \\
     -d '{
       \"email\":\"user@example.com\",
       \"newPassword\":\"newPassword789#\"
     }'
   ```

### Frontend Testing

1. **Navigate to Profile Page**:
   - Login as any user
   - Go to Profile → Security tab
   - Test password change with various scenarios

2. **Test Forgot Password Flow**:
   - Go to `/forgot-password`
   - Enter email and request OTP
   - Check email for OTP
   - Complete password reset

3. **Test First-Time Password Setup**:
   - Create a new user (Ward Officer or Maintenance Team)
   - Check email for setup link
   - Complete password setup

### Email Testing

1. **Check Email Templates**:
   - Verify all templates load correctly
   - Test variable replacement
   - Confirm URLs use WHOST and WPORT

2. **SMTP Configuration**:
   - Test email delivery
   - Verify email formatting
   - Check spam folder if emails not received

## Troubleshooting

### Common Issues

1. **Emails Not Received**:
   - Check SMTP configuration
   - Verify EMAIL_USER and EMAIL_PASS
   - Check spam/junk folder
   - Ensure EMAIL_SERVICE is correct

2. **Invalid URLs in Emails**:
   - Verify WHOST and WPORT in .env
   - Check NODE_ENV setting
   - Ensure protocol (HTTP/HTTPS) is correct

3. **OTP Verification Fails**:
   - Check OTP expiration (10 minutes)
   - Verify OTP was not already used
   - Ensure email matches exactly

4. **Password Validation Errors**:
   - Confirm password meets all requirements
   - Check for hidden characters
   - Verify frontend and backend validation match

### Debug Commands

```bash
# Check email transporter
node -e \"
const { verifyEmailTransporter } = require('./server/utils/mailService.js');
verifyEmailTransporter().then(console.log).catch(console.error);
\"

# Test password validation
node -e \"
const { validatePasswordStrength } = require('./server/controller/userController.js');
console.log(validatePasswordStrength('TestPassword123!'));
\"
```

## Security Best Practices

1. **Password Storage**:
   - Never log passwords in plain text
   - Use bcrypt with appropriate salt rounds
   - Implement password history to prevent reuse

2. **OTP Security**:
   - Use cryptographically secure random generation
   - Implement rate limiting for OTP requests
   - Clear OTP sessions after use

3. **Email Security**:
   - Use HTTPS for all email links
   - Implement email verification for sensitive operations
   - Monitor for suspicious email patterns

4. **Session Management**:
   - Implement proper JWT expiration
   - Use secure HTTP-only cookies when possible
   - Invalidate sessions on password change

## Monitoring and Logging

### Key Metrics to Monitor

1. **Password Operations**:
   - Password change success/failure rates
   - OTP request frequency
   - Password reset completion rates

2. **Email Delivery**:
   - Email send success rates
   - SMTP connection failures
   - Template rendering errors

3. **Security Events**:
   - Failed login attempts
   - Invalid OTP submissions
   - Suspicious password reset patterns

### Log Examples

```javascript
// Successful password change
logger.info('Password changed successfully', {
  module: 'auth',
  userId: 'user-id',
  timestamp: new Date().toISOString()
});

// OTP sent
logger.info('Password reset OTP sent', {
  module: 'auth',
  email: 'user@example.com',
  purpose: 'PASSWORD_RESET'
});

// Security alert
logger.warn('Multiple failed OTP attempts', {
  module: 'security',
  email: 'user@example.com',
  attempts: 5,
  timeWindow: '5 minutes'
});
```

## Conclusion

The password management system is fully implemented and production-ready with:

- ✅ Secure password change functionality
- ✅ OTP-based password reset flow
- ✅ Professional email templates
- ✅ Environment-based configuration
- ✅ Comprehensive validation
- ✅ Security best practices
- ✅ Proper error handling
- ✅ Monitoring and logging

The system is designed to be maintainable, secure, and user-friendly while meeting all specified requirements.