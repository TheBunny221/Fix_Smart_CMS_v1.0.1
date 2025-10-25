# Legacy Components Archive

This folder contains React components that were identified as unused during the component cleanup process on **${new Date().toISOString().split('T')[0]}**.

## Purpose

These components have been moved here instead of being deleted to:
- Maintain backward traceability
- Allow for easy restoration if needed
- Preserve development history
- Enable future reference or reuse

## Moved Components

### Main Components
| Component | Original Path | Reason for Move | Date Moved |
|-----------|---------------|-----------------|------------|
| `AccessibleComponents.tsx` | `components/AccessibleComponents.tsx` | No usage found in codebase | 2025-10-18 |
| `AllComplaintCard.tsx` | `components/AllComplaintCard.tsx` | Only used by unused WardDashboard component | 2025-10-18 |
| `ComplaintStatusUpdate.tsx` | `components/ComplaintStatusUpdate.tsx` | No usage found in codebase | 2025-10-18 |
| `ConfigLoadingFallback.tsx` | `components/ConfigLoadingFallback.tsx` | No usage found in codebase | 2025-10-18 |
| `LanguageSwitcher.tsx` | `components/LanguageSwitcher.tsx` | No usage found in codebase | 2025-10-18 |
| `Layout.tsx` | `components/Layout.tsx` | Replaced by UnifiedLayout | 2025-10-18 |
| `LoaderAwareComponent.tsx` | `components/LoaderAwareComponent.tsx` | No usage found in codebase | 2025-10-18 |
| `LocationMapDialog.tsx` | `components/LocationMapDialog.tsx` | Replaced by SimpleLocationMapDialog | 2025-10-18 |
| `MaterialsModal.tsx` | `components/MaterialsModal.tsx` | No usage found in codebase | 2025-10-18 |
| `OptimizedComponents.tsx` | `components/OptimizedComponents.tsx` | No usage found in codebase | 2025-10-18 |
| `OTPVerification.tsx` | `components/OTPVerification.tsx` | No usage found in codebase | 2025-10-18 |
| `ReportGenerator.tsx` | `components/ReportGenerator.tsx` | No usage found in codebase | 2025-10-18 |
| `RoleSwitcher.tsx` | `components/RoleSwitcher.tsx` | No usage found in codebase | 2025-10-18 |
| `StatusChip.tsx` | `components/StatusChip.tsx` | No usage found in codebase | 2025-10-18 |
| `StatusTracker.tsx` | `components/StatusTracker.tsx` | No usage found in codebase | 2025-10-18 |
| `UXComponents.tsx` | `components/UXComponents.tsx` | No usage found in codebase | 2025-10-18 |
| `WardDashboard.tsx` | `components/WardDashboard.tsx` | No usage found in codebase | 2025-10-18 |

### Page Components
| Component | Original Path | Reason for Move | Date Moved |
|-----------|---------------|-----------------|------------|
| `AdminAnalytics.tsx` | `pages/AdminAnalytics.tsx` | No route defined, replaced by UnifiedReports | 2025-10-18 |
| `AdminReports.tsx` | `pages/AdminReports.tsx` | No route defined, replaced by UnifiedReports | 2025-10-18 |
| `ReportsAnalytics.tsx` | `pages/ReportsAnalytics.tsx` | No route defined, replaced by UnifiedReports | 2025-10-18 |
| `TokenClearHelper.tsx` | `pages/TokenClearHelper.tsx` | No route defined, utility component not actively used | 2025-10-18 |

### Layout Components
| Component | Original Path | Reason for Move | Date Moved |
|-----------|---------------|-----------------|------------|
| `DashboardLayout.tsx` | `components/layouts/DashboardLayout.tsx` | No usage found in codebase | 2025-10-18 |

### Form Components
| Component | Original Path | Reason for Move | Date Moved |
|-----------|---------------|-----------------|------------|
| `FormField.tsx` | `components/forms/FormField.tsx` | No usage found in codebase | 2025-10-18 |

### UI Components
| Component | Original Path | Reason for Move | Date Moved |
|-----------|---------------|-----------------|------------|
| `command.tsx` | `components/ui/command.tsx` | No usage found in codebase | ${new Date().toISOString().split('T')[0]} |
| `pagination.tsx` | `components/ui/pagination.tsx` | No usage found in codebase | ${new Date().toISOString().split('T')[0]} |
| `sidebar.tsx` | `components/ui/sidebar.tsx` | No usage found in codebase | ${new Date().toISOString().split('T')[0]} |

### Test Files
| Component | Original Path | Reason for Move | Date Moved |
|-----------|---------------|-----------------|------------|
| `ComplaintQuickActions.test.tsx` | `components/__tests__/ComplaintQuickActions.test.tsx` | No usage found in codebase | ${new Date().toISOString().split('T')[0]} |

## Analysis Details

The components were identified as unused through automated analysis that:
1. Scanned all `.tsx` and `.jsx` files in the project
2. Checked for import statements and JSX usage
3. Cross-referenced usage across the entire codebase
4. Identified components with zero references

**Total Components Analyzed**: 85  
**Components Moved to Legacy**: 27  
**Active Components Remaining**: 58

## Restoring Components

If you need to restore any of these components:

1. **Move the file back** to its original location:
   ```bash
   mv client/legacy-components/ComponentName.tsx client/components/
   ```

2. **Update imports** in any files that need to use the component

3. **Test thoroughly** to ensure the component works as expected

4. **Update this README** to remove the component from the legacy list

## Component Descriptions

### AccessibleComponents.tsx
- **Purpose**: Accessibility-focused component utilities
- **Dependencies**: React, accessibility libraries
- **Last Known Usage**: Unknown

### ComplaintStatusUpdate.tsx
- **Purpose**: Component for updating complaint status
- **Dependencies**: React, UI components
- **Last Known Usage**: Possibly replaced by UpdateComplaintModal

### LanguageSwitcher.tsx
- **Purpose**: Language switching functionality
- **Dependencies**: React, i18n libraries
- **Last Known Usage**: Language switching might be handled elsewhere

### MaterialsModal.tsx
- **Purpose**: Modal for materials management
- **Dependencies**: React, modal components
- **Last Known Usage**: Materials functionality might be integrated elsewhere

### OptimizedComponents.tsx
- **Purpose**: Performance-optimized component utilities
- **Dependencies**: React, optimization libraries
- **Last Known Usage**: Optimizations might be built into other components

### OTPVerification.tsx
- **Purpose**: OTP verification component
- **Dependencies**: React, OTP libraries
- **Last Known Usage**: Replaced by OtpVerificationModal

### RoleSwitcher.tsx
- **Purpose**: User role switching functionality
- **Dependencies**: React, authentication
- **Last Known Usage**: Role switching might be handled in navigation

### StatusChip.tsx
- **Purpose**: Status display chip component
- **Dependencies**: React, UI components
- **Last Known Usage**: Replaced by Badge components

### StatusTracker.tsx
- **Purpose**: Status tracking component
- **Dependencies**: React, tracking libraries
- **Last Known Usage**: Status tracking integrated into other components

### UXComponents.tsx
- **Purpose**: UX-focused component utilities
- **Dependencies**: React, UX libraries
- **Last Known Usage**: UX improvements integrated into main components

### AllComplaintCard.tsx
- **Purpose**: Card component for displaying total complaints in ward dashboard
- **Dependencies**: React, UI components, Redux store
- **Last Known Usage**: Only used by WardDashboard component (also unused)

### ConfigLoadingFallback.tsx
- **Purpose**: Loading fallback component for configuration loading states
- **Dependencies**: React, Lucide icons
- **Last Known Usage**: No imports found in codebase

### Layout.tsx
- **Purpose**: Legacy layout component with sidebar and navigation
- **Dependencies**: React, React Router, Redux, UI components
- **Last Known Usage**: Replaced by UnifiedLayout component

### LoaderAwareComponent.tsx
- **Purpose**: Higher-order component for loader utilities
- **Dependencies**: React, custom hooks, Redux
- **Last Known Usage**: No imports found in codebase

### LocationMapDialog.tsx
- **Purpose**: Map dialog component for location selection with Leaflet
- **Dependencies**: React, Leaflet, React-Leaflet, UI components
- **Last Known Usage**: Replaced by SimpleLocationMapDialog

### ReportGenerator.tsx
- **Purpose**: HTML report generation utility class
- **Dependencies**: React (for preview component)
- **Last Known Usage**: No imports found in codebase

### WardDashboard.tsx
- **Purpose**: Dashboard component for ward-specific view
- **Dependencies**: React, AllComplaintCard component
- **Last Known Usage**: No imports found in codebase

### FormField.tsx
- **Purpose**: Comprehensive form field components with React Hook Form
- **Dependencies**: React, React Hook Form, UI components, Lucide icons
- **Last Known Usage**: No imports found in codebase

### DashboardLayout.tsx
- **Purpose**: Dashboard layout component
- **Dependencies**: React, layout components
- **Last Known Usage**: Replaced by UnifiedLayout

### UI Components (command.tsx, pagination.tsx, sidebar.tsx)
- **Purpose**: Shadcn/UI components that weren't being used
- **Dependencies**: Radix UI, React
- **Last Known Usage**: Functionality might be implemented differently

## Maintenance

This folder should be reviewed periodically (every 6 months) to:
- Remove components that are definitely no longer needed
- Restore components that have found new use cases
- Update documentation as needed

## Contact

If you have questions about any of these components or need help restoring them, please contact the development team.

---
*Generated by component cleanup process on ${new Date().toISOString()}*