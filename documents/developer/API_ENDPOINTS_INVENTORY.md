# API Endpoints Inventory - Fix_Smart_CMS v 1.0.0

## Summary Statistics
- **Total Route Files**: 19
- **Documented Route Files**: 7 (37%)
- **Undocumented Route Files**: 12 (63%)
- **Estimated Total Endpoints**: 80+

## Detailed Endpoint Analysis

### 1. Authentication Routes (`authRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: CRITICAL - Core authentication system

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/login-otp` | OTP-based login | No |
| POST | `/api/auth/verify-otp` | Verify OTP for login | No |
| POST | `/api/auth/verify-registration-otp` | Verify registration OTP | No |
| POST | `/api/auth/resend-registration-otp` | Resend registration OTP | No |
| POST | `/api/auth/send-password-setup` | Send password setup link | No |
| POST | `/api/auth/set-password/:token` | Set password with token | No |
| POST | `/api/auth/logout` | User logout | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| GET | `/api/auth/verify-token` | Verify JWT token | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### 2. Complaint Routes (`complaintRoutes.js`) ✅ WELL DOCUMENTED
**Priority**: HIGH - Core business functionality

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/complaints/public/stats` | Public complaint statistics | No |
| GET | `/api/complaints` | List complaints with filters | Yes |
| POST | `/api/complaints` | Create new complaint | Yes |
| GET | `/api/complaints/stats` | Complaint statistics | Yes |
| GET | `/api/complaints/ward-users` | Ward users for assignment | Yes |
| GET | `/api/complaints/ward-dashboard-stats` | Ward dashboard stats | Yes |
| GET | `/api/complaints/:id` | Get complaint details | Yes |
| PUT | `/api/complaints/:id` | Update complaint | Yes |
| PUT | `/api/complaints/:id/status` | Update complaint status | Yes |
| PUT | `/api/complaints/:id/assign` | Assign complaint | Yes |
| POST | `/api/complaints/:id/feedback` | Add citizen feedback | Yes |
| PUT | `/api/complaints/:id/reopen` | Reopen complaint | Yes |
| POST | `/api/complaints/:id/attachments` | Add attachments | Yes |

### 3. Guest Routes (`guestRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: HIGH - Public API access

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/guest/complaint` | Submit guest complaint | No |
| POST | `/api/guest/complaint-with-attachments` | Submit complaint with files | No |
| POST | `/api/guest/verify-otp` | Verify OTP and register | No |
| POST | `/api/guest/resend-otp` | Resend OTP | No |
| GET | `/api/guest/track/:complaintId` | Track complaint status | No |
| GET | `/api/guest/stats` | Public statistics | No |
| GET | `/api/guest/wards` | Public ward list | No |
| GET | `/api/guest/complaint-types` | Public complaint types | No |
| POST | `/api/guest/service-request` | Submit service request | No |
| POST | `/api/guest/verify-service-otp` | Verify service OTP | No |
| GET | `/api/guest/track-service/:requestId` | Track service request | No |
| GET | `/api/guest/service-types` | Get service types | No |
| GET | `/api/guest/files/:filename` | Serve guest files | No |

### 4. Report Routes (`reportRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: HIGH - Analytics and reporting

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reports/dashboard` | Dashboard metrics | Yes |
| GET | `/api/reports/trends` | Complaint trends | Yes |
| GET | `/api/reports/sla` | SLA compliance report | Yes |
| GET | `/api/reports/analytics` | Advanced analytics | Yes |
| GET | `/api/reports/heatmap` | Heatmap data | Yes |
| GET | `/api/reports/export` | Export reports | Yes |

### 5. System Config Routes (`systemConfigRoutes.js`) ✅ WELL DOCUMENTED
**Priority**: MEDIUM - System configuration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/config/public` | Public configuration | No |
| GET | `/api/config/stats` | Cache statistics | Yes (Admin) |
| GET | `/api/config/admin` | Admin configuration | Yes (Admin) |
| POST | `/api/config/refresh` | Refresh cache | Yes (Admin) |
| PUT | `/api/config/:key` | Update configuration | Yes (Admin) |
| DELETE | `/api/config/:key` | Delete configuration | Yes (Admin) |

### 6. Upload Routes (`uploadRoutes.js`) ✅ DOCUMENTED
**Priority**: MEDIUM - File management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/uploads/complaint/:complaintId/attachment` | Upload complaint attachment | Optional |
| POST | `/api/uploads/profile/picture` | Upload profile picture | Yes |
| POST | `/api/uploads/logo` | Upload system logo | Yes |
| GET | `/api/uploads/:filename` | Get attachment | No |
| GET | `/api/uploads/logo/:filename` | Get logo file | No |
| DELETE | `/api/uploads/:id` | Delete attachment | Yes |

### 7. User Routes (`userRoutes.js`) ✅ PARTIALLY DOCUMENTED
**Priority**: MEDIUM - User management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/verify-account/:token` | Verify account | No |
| GET | `/api/users/wards` | Get ward list | Yes |
| GET | `/api/users` | List users | Yes (Admin) |
| POST | `/api/users` | Create user | Yes (Admin) |
| GET | `/api/users/stats` | User statistics | Yes |

### 8. Admin Routes (`adminRoutes.js`) ✅ WELL DOCUMENTED
**Priority**: MEDIUM - Administrative functions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | List all users | Yes (Admin) |
| POST | `/api/admin/users` | Create user | Yes (Admin) |
| PUT | `/api/admin/users/:id` | Update user | Yes (Admin) |
| DELETE | `/api/admin/users/:id` | Delete user | Yes (Admin) |
| PUT | `/api/admin/users/:id/activate` | Activate user | Yes (Admin) |
| PUT | `/api/admin/users/:id/deactivate` | Deactivate user | Yes (Admin) |
| POST | `/api/admin/users/bulk` | Bulk user operations | Yes (Admin) |
| GET | `/api/admin/stats/users` | User statistics | Yes (Admin) |

### 9. Ward Routes (`wardRoutes.js`) ✅ DOCUMENTED
**Priority**: MEDIUM - Geographic management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/wards/boundaries` | Get ward boundaries | No |
| PUT | `/api/wards/:wardId/boundaries` | Update boundaries | Yes (Admin) |
| POST | `/api/wards/detect-area` | Detect area from coordinates | No |

### 10. Complaint Type Routes (`complaintTypeRoutes.js`) ✅ WELL DOCUMENTED
**Priority**: MEDIUM - Complaint categorization

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/complaint-types` | List complaint types | Yes |
| GET | `/api/complaint-types/stats` | Type statistics | Yes |
| GET | `/api/complaint-types/:id` | Get specific type | Yes |
| POST | `/api/complaint-types` | Create type | Yes (Admin) |
| PUT | `/api/complaint-types/:id` | Update type | Yes (Admin) |
| DELETE | `/api/complaint-types/:id` | Delete type | Yes (Admin) |

### 11. Maintenance Analytics Routes (`maintenanceAnalyticsRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: MEDIUM - Maintenance team analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/maintenance/analytics` | Maintenance analytics | Yes (Maintenance) |
| GET | `/api/maintenance/dashboard` | Maintenance dashboard | Yes (Maintenance) |

### 12. Materials Routes (`materialsRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: LOW - Materials management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/materials/complaints/:id/materials` | Get complaint materials | Yes |
| POST | `/api/materials/complaints/:id/materials` | Add materials | Yes |
| PUT | `/api/materials/materials/:id` | Update material | Yes |
| DELETE | `/api/materials/materials/:id` | Delete material | Yes |

### 13. Log Routes (`logRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: LOW - System logging

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/logs` | Submit frontend logs | No |
| GET | `/api/logs/stats` | Log statistics | Yes (Admin) |

### 14. Guest OTP Routes (`guestOtpRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: MEDIUM - Guest OTP management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/guest-otp/test` | Test endpoint | No |
| POST | `/api/guest-otp/request-complaint-otp` | Request OTP | No |

### 15. Test Routes (`testRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: LOW - Development testing

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/test/test-email` | Test email functionality | No (Dev only) |
| GET | `/api/test/email-config` | Email configuration info | No (Dev only) |
| POST | `/api/test/seed-admin` | Seed admin user | No (Dev only) |

### 16. Captcha Routes (`captchaRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: LOW - CAPTCHA verification

*Endpoints need to be analyzed*

### 17. Complaint Photos Routes (`complaintPhotosRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: MEDIUM - Photo management

*Endpoints need to be analyzed*

### 18. Complaint Summary Routes (`complaintSummary.js`) ❌ NO SWAGGER DOCS
**Priority**: MEDIUM - Summary analytics

*Endpoints need to be analyzed*

### 19. Geo Routes (`geoRoutes.js`) ❌ NO SWAGGER DOCS
**Priority**: MEDIUM - Geographic services

*Endpoints need to be analyzed*

## Documentation Priority Matrix

### Critical Priority (Must Document First):
1. **Authentication Routes** - Core system functionality
2. **Guest Routes** - Public API access
3. **Report Routes** - Essential for admin workflows

### High Priority:
4. **Maintenance Analytics** - Team-specific functionality
5. **Guest OTP Routes** - Guest workflow completion
6. **Complaint Photos** - Media management

### Medium Priority:
7. **Geo Routes** - Geographic services
8. **Complaint Summary** - Analytics enhancement
9. **Materials Routes** - Resource management

### Low Priority:
10. **Log Routes** - System monitoring
11. **Test Routes** - Development utilities
12. **Captcha Routes** - Security utilities

## Recommendations

1. **Immediate Action**: Document authentication, guest, and reporting routes
2. **Schema Validation**: Ensure all documented endpoints match actual implementations
3. **Testing Integration**: Validate documented examples against real API responses
4. **Modular Organization**: Split large route files into logical modules
5. **Automated Sync**: Implement tools to keep documentation current with code changes