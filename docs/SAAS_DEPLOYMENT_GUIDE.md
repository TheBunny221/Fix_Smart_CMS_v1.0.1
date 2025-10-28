# SaaS Deployment Configuration Guide

This guide explains how to configure the Smart CMS application for deployment in different cities/regions as a SaaS solution.

## 🌍 Geographic Configuration

The application uses dynamic boundary configuration that can be customized for any city or region. All geographic settings are stored in the system configuration and can be modified through the admin interface or by updating the seed data.

### Key Configuration Areas

1. **Service Area Boundaries** - Define where complaints can be submitted
2. **Map Settings** - Default coordinates, search context, and country codes
3. **Contact Information** - Organization-specific contact details
4. **Branding** - Application name, logo, and complaint ID prefixes

## 📋 Pre-Deployment Checklist

Before deploying for a new city/region, customize the following in `prisma/seeds/seed.json`:

### 1. Application Branding
```json
{
  "key": "APP_NAME",
  "value": "Your City CMS", // Replace with your city/organization name
}
```

### 2. Geographic Settings
```json
{
  "key": "MAP_SEARCH_PLACE",
  "value": "Your City, State, Country", // e.g., "Toronto, ON, Canada"
},
{
  "key": "MAP_COUNTRY_CODES", 
  "value": "ca", // ISO2 country code (us, in, uk, ca, au, etc.)
},
{
  "key": "MAP_DEFAULT_LAT",
  "value": "43.6532", // Your city's latitude
},
{
  "key": "MAP_DEFAULT_LNG", 
  "value": "-79.3832", // Your city's longitude
}
```

### 3. Service Area Boundary
Define the exact area where complaints can be submitted using GeoJSON:

```json
{
  "key": "SERVICE_AREA_BOUNDARY",
  "value": "{\"type\":\"Polygon\",\"coordinates\":[[[lng1,lat1],[lng2,lat2],...]]}"
}
```

**Tools for creating boundaries:**
- [geojson.io](https://geojson.io) - Interactive boundary drawing
- [geojson-tools](https://geojson-tools.com/) - GeoJSON validation and editing
- City/municipal GIS data sources

### 4. Contact Information
```json
{
  "key": "CONTACT_HELPLINE",
  "value": "+1-416-555-0123", // Local helpline number
},
{
  "key": "CONTACT_EMAIL", 
  "value": "support@yourcity.gov", // Support email
},
{
  "key": "CONTACT_OFFICE_ADDRESS",
  "value": "City Hall, 123 Main St, Your City, Province, Postal Code"
}
```

### 5. Administrative Divisions
Update the `ward` section with your city's districts/wards/zones:

```json
"ward": [
  {
    "name": "District 1 - Your Area Name",
    "description": "Description of this district/ward",
    "isActive": true,
    "subZones": [
      {
        "name": "Sub-area A",
        "description": "Description of sub-area",
        "isActive": true
      }
    ]
  }
]
```

## 🚀 Deployment Steps

### 1. Environment Setup
```bash
# Set admin credentials
export ADMIN_EMAIL="admin@yourcity.gov"
export ADMIN_PASSWORD="secure_password_here"

# For destructive seeding (clears existing data)
export DESTRUCTIVE_SEED="true"
```

### 2. Database Seeding
```bash
# Run the seeder with your customized configuration
npm run seed

# Or with Prisma directly
npx prisma db seed
```

### 3. Verify Configuration
After seeding, verify the configuration through:
- Admin dashboard → System Configuration
- Test the location picker with your service area
- Verify ward/district assignments work correctly

## 🗺️ Geographic Coordinate Examples

### Major Cities Reference
| City | Latitude | Longitude | Country Code |
|------|----------|-----------|--------------|
| New York, USA | 40.7128 | -74.0060 | us |
| Toronto, Canada | 43.6532 | -79.3832 | ca |
| London, UK | 51.5074 | -0.1278 | uk |
| Sydney, Australia | -33.8688 | 151.2093 | au |
| Mumbai, India | 19.0760 | 72.8777 | in |
| Berlin, Germany | 52.5200 | 13.4050 | de |

### Service Area Boundary Configuration
The system uses a unified `SERVICE_AREA_BOUNDARY` configuration that defines the exact service area using GeoJSON polygon format. This replaces the legacy bounding box approach and provides precise boundary control.

**Key Benefits:**
- **Precise boundaries**: Define exact service area shapes, not just rectangular boxes
- **Unified configuration**: Single source of truth for all boundary-related functionality
- **Validation control**: Enable/disable location validation with `SERVICE_AREA_VALIDATION_ENABLED`

**Configuration:**
```json
{
  "key": "SERVICE_AREA_BOUNDARY",
  "value": "{\"type\":\"Polygon\",\"coordinates\":[[[lng1,lat1],[lng2,lat2],...]]}"
},
{
  "key": "SERVICE_AREA_VALIDATION_ENABLED", 
  "value": "true"
}
```

## 🔧 Runtime Configuration

After deployment, administrators can modify settings through:

1. **Admin Dashboard** → System Configuration
2. **API Endpoints**:
   - `GET /api/system-config` - View all settings
   - `PUT /api/system-config/{key}` - Update specific setting
   - `GET /api/system-config/boundary/data` - Get boundary configuration

## 🎨 Customization Options

### Complaint Types
Customize complaint categories in the `complaintType` section:
```json
{
  "name": "Snow Removal", // Relevant to your region
  "description": "Snow clearing and winter maintenance",
  "priority": "HIGH",
  "slaHours": 12
}
```

### Localization
The system supports multiple languages. Configure default language and available options through system settings.

### SLA and Business Rules
- `DEFAULT_SLA_HOURS` - Default response time
- `AUTO_CLOSE_DAYS` - Auto-close resolved complaints
- `CITIZEN_DAILY_COMPLAINT_LIMIT` - Rate limiting

## 🔍 Testing Your Configuration

### 1. Location Picker Test
- Open complaint form
- Click "Select Location on Map"
- Verify your service area boundary is displayed
- Test clicking inside/outside the boundary

### 2. Ward Detection Test
- Select locations within your service area
- Verify correct ward/district is detected
- Test edge cases near boundaries

### 3. Search Functionality Test
- Search for local landmarks
- Verify results are biased to your region
- Test with local addresses

## 📞 Support

For deployment assistance or custom configuration needs:
- Review the system logs for any seeding errors
- Check the admin dashboard for configuration validation
- Test all geographic features before going live

## 🔄 Updates and Maintenance

### Updating Boundaries
1. Use admin interface: System Configuration → SERVICE_AREA_BOUNDARY
2. Or update via API with new GeoJSON data
3. Test thoroughly before applying to production

### Adding New Districts/Wards
1. Admin Dashboard → Ward Management
2. Add new wards with descriptions
3. Configure sub-zones if needed
4. Assign maintenance teams

---

**Note**: Always test your configuration in a staging environment before deploying to production. Verify that all geographic features work correctly with your specific city/region data.