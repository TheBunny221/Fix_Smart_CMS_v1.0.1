# Enhanced System Configuration Management

## Overview

The system configuration management has been enhanced to include all configurations defined in seed.json with enable/disable functionality, providing administrators with complete control over system behavior.

## Key Features

### 1. Comprehensive Configuration Coverage

- **All Seed Configurations**: Every configuration defined in `prisma/seed.json` is now available in the System Settings tab
- **Dynamic Loading**: Configurations are loaded dynamically from the backend, not hardcoded in the frontend
- **Automatic Sync**: Missing configurations from seed.json are automatically added to the database

### 2. Enable/Disable Functionality

- **Toggle Control**: Each configuration has an enable/disable checkbox
- **Visual Feedback**: Disabled configurations appear grayed out and non-editable
- **Runtime Respect**: System logic respects the enabled/disabled state of configurations

### 3. Type-Aware Input Fields

- **String Fields**: Text input for string values
- **Number Fields**: Number input with validation for numeric values
- **Boolean Fields**: Checkbox input for true/false values
- **JSON Fields**: Textarea input for complex JSON configurations

## Configuration Categories

### Application Settings

- `APP_NAME`: Application name displayed in headers, emails, and PDFs
- `APP_LOGO_URL`: URL for the application logo
- `APP_LOGO_SIZE`: Size of the application logo (small, medium, large)

### Complaint Management

- `COMPLAINT_ID_PREFIX`: Prefix for complaint IDs (e.g., "KSC")
- `COMPLAINT_ID_START_NUMBER`: Starting number for complaint ID sequence
- `COMPLAINT_ID_LENGTH`: Length of the numeric part in complaint IDs
- `DEFAULT_SLA_HOURS`: Default SLA time in hours
- `AUTO_ASSIGN_COMPLAINTS`: Automatically assign complaints to ward officers
- `CITIZEN_DAILY_COMPLAINT_LIMIT`: Maximum complaints per citizen per day
- `COMPLAINT_PRIORITIES`: Available complaint priority levels
- `COMPLAINT_STATUSES`: Available complaint status values

### File Upload Settings

- `MAX_FILE_SIZE_MB`: Maximum file upload size in MB
- `COMPLAINT_PHOTO_MAX_SIZE`: Maximum photo size in MB for complaints
- `COMPLAINT_PHOTO_MAX_COUNT`: Maximum number of photos per complaint

### Communication Settings

- `CONTACT_HELPLINE`: Helpline phone number for citizen support
- `CONTACT_EMAIL`: Official support email address
- `CONTACT_OFFICE_HOURS`: Official office hours for citizen services
- `CONTACT_OFFICE_ADDRESS`: Official office address
- `EMAIL_NOTIFICATIONS_ENABLED`: Enable email notifications for complaints
- `SMS_NOTIFICATIONS_ENABLED`: Enable SMS notifications for complaints
- `NOTIFICATION_SETTINGS`: JSON configuration for notification preferences

### System Behavior

- `SYSTEM_MAINTENANCE`: System maintenance mode status
- `MAINTENANCE_MODE`: Alternative maintenance mode flag
- `GUEST_COMPLAINT_ENABLED`: Allow guest users to submit complaints
- `CITIZEN_REGISTRATION_ENABLED`: Allow citizen self-registration
- `AUTO_CLOSE_RESOLVED_COMPLAINTS`: Automatically close resolved complaints
- `AUTO_CLOSE_DAYS`: Days after which resolved complaints are auto-closed
- `OTP_EXPIRY_MINUTES`: OTP expiration time in minutes
- `ADMIN_EMAIL`: Administrator email address
- `SYSTEM_VERSION`: Current system version

### Map & Location Settings

- `MAP_SEARCH_PLACE`: Place context appended to searches
- `MAP_COUNTRY_CODES`: ISO2 country codes for Nominatim bias
- `MAP_DEFAULT_LAT`: Default map center latitude
- `MAP_DEFAULT_LNG`: Default map center longitude
- `MAP_BBOX_NORTH`: North latitude of bounding box
- `MAP_BBOX_SOUTH`: South latitude of bounding box
- `MAP_BBOX_EAST`: East longitude of bounding box
- `MAP_BBOX_WEST`: West longitude of bounding box

## Backend Implementation

### Database Schema

The `system_config` table includes:

- `key`: Unique configuration key
- `value`: Configuration value (stored as string)
- `description`: Human-readable description
- `isActive`: Boolean flag for enable/disable functionality
- `updatedAt`: Timestamp of last update

### API Endpoints

#### Get All System Settings

```http
GET /api/system-config
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "message": "System settings retrieved successfully",
  "data": [
    {
      "key": "APP_NAME",
      "value": "NLC-CMS",
      "description": "Application name",
      "type": "string",
      "isActive": true,
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Update System Setting

```http
PUT /api/system-config/:key
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "value": "new_value",
  "isActive": true
}
```

#### Get Public System Settings

```http
GET /api/system-config/public
```

**Response:**

```json
{
  "success": true,
  "data": {
    "config": [
      {
        "key": "APP_NAME",
        "value": "NLC-CMS",
        "description": "Application name",
        "type": "string",
        "enabled": true
      }
    ],
    "complaintTypes": [...]
  }
}
```

### Configuration Sync Process

The system automatically syncs configurations from `seed.json`:

```javascript
const syncConfigurationsFromSeed = async () => {
  const seedData = JSON.parse(fs.readFileSync("prisma/seed.json", "utf8"));
  const seedConfigs = seedData.systemConfig || [];

  for (const seedConfig of seedConfigs) {
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { key: seedConfig.key },
    });

    if (!existingConfig) {
      // Insert missing configuration with enabled=false by default
      await prisma.systemConfig.create({
        data: {
          key: seedConfig.key,
          value: seedConfig.value,
          description: seedConfig.description,
          isActive: false, // Disabled by default for new configs
        },
      });
    }
  }
};
```

## Frontend Implementation

### Dynamic Configuration Rendering

The AdminConfig component now dynamically renders all configurations:

```typescript
{
  systemSettings
    .filter(
      (setting) =>
        !["APP_NAME", "APP_LOGO_URL", "APP_LOGO_SIZE"].includes(setting.key),
    )
    .map((setting) => (
      <div
        key={setting.key}
        className={`border rounded-lg p-4 ${
          !setting.isActive ? "bg-gray-50 opacity-75" : ""
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">
            {setting.key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </h4>
          <Checkbox
            checked={setting.isActive}
            onCheckedChange={async (checked) => {
              await apiCall(`/system-config/${setting.key}`, {
                method: "PUT",
                body: JSON.stringify({ isActive: checked }),
              });
              // Update local state
            }}
          />
          <span className="text-xs text-gray-500">
            {setting.isActive ? "Enabled" : "Disabled"}
          </span>
        </div>
        {/* Dynamic input field based on type */}
      </div>
    ));
}
```

### Type-Aware Input Fields

Different input types based on configuration type:

```typescript
{
  setting.type === "json" ? (
    <Textarea
      value={setting.value}
      disabled={!setting.isActive}
      placeholder="Enter JSON configuration"
    />
  ) : setting.type === "boolean" ? (
    <Checkbox checked={setting.value === "true"} disabled={!setting.isActive} />
  ) : setting.type === "number" ? (
    <Input type="number" value={setting.value} disabled={!setting.isActive} />
  ) : (
    <Input type="text" value={setting.value} disabled={!setting.isActive} />
  );
}
```

## Usage Examples

### Enabling a Configuration

1. Navigate to Admin → System Configuration → System Settings tab
2. Find the configuration you want to enable
3. Check the checkbox next to the configuration name
4. The input field becomes editable and the configuration is active

### Disabling a Configuration

1. Navigate to the configuration in System Settings
2. Uncheck the checkbox next to the configuration name
3. The input field becomes grayed out and the configuration is ignored by the system

### Updating Configuration Values

1. Ensure the configuration is enabled (checkbox checked)
2. Modify the value in the input field
3. Click outside the field or press Tab to save
4. The system immediately applies the new value

## System Logic Integration

### Respecting Enabled/Disabled State

All system logic now checks the enabled state before using configuration values:

```javascript
// Example: Check if guest complaints are enabled
const guestComplaintConfig = await prisma.systemConfig.findUnique({
  where: { key: "GUEST_COMPLAINT_ENABLED" },
});

if (guestComplaintConfig?.isActive && guestComplaintConfig?.value === "true") {
  // Allow guest complaints
} else {
  // Reject guest complaints
}
```

### Configuration Validation

API endpoints validate that configurations are enabled before processing:

```javascript
const validateConfigEnabled = async (key) => {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!config?.isActive) {
    throw new Error(`Configuration ${key} is currently disabled`);
  }

  return config;
};
```

## Security Considerations

### Access Control

- Only administrators can view and modify system configurations
- Public endpoint only returns non-sensitive configurations
- Sensitive configurations are filtered out from public responses

### Audit Trail

- All configuration changes are logged with timestamps
- Enable/disable actions are tracked for compliance
- User information is recorded for accountability

### Validation

- Input validation based on configuration type
- JSON configurations are validated for proper syntax
- Numeric configurations are validated for valid ranges

## Troubleshooting

### Configuration Not Appearing

1. Check if the configuration exists in `seed.json`
2. Restart the application to trigger sync process
3. Verify database connectivity and permissions

### Configuration Not Taking Effect

1. Ensure the configuration is enabled (checkbox checked)
2. Check if the value is properly formatted for the type
3. Verify that system logic is checking the enabled state

### Sync Issues

1. Check server logs for sync errors
2. Verify `seed.json` file exists and is readable
3. Ensure database write permissions are available

## Best Practices

### Configuration Management

1. **Test Before Enabling**: Always test configurations in a development environment
2. **Document Changes**: Keep track of configuration changes and their purposes
3. **Backup Before Changes**: Create database backups before major configuration updates
4. **Monitor Impact**: Watch system behavior after enabling new configurations

### Development Guidelines

1. **Check Enabled State**: Always check `isActive` before using configuration values
2. **Provide Fallbacks**: Include fallback values for disabled configurations
3. **Validate Inputs**: Validate configuration values before using them
4. **Log Usage**: Log when configurations are used for debugging purposes

This enhanced system configuration management provides administrators with complete control over system behavior while maintaining security and reliability.
