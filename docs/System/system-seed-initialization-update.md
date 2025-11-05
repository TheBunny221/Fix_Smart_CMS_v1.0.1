# System Seed Initialization Update (v1.0.4)

## 🎯 Objective
Add the missing system configuration settings, active wards, and complaint types to the seed bundle so every environment that runs `npm run db:seed` starts with a fully configured NLC-CMS instance.

## ✅ Added System Configurations
All values from the `systemConfig` array consumed by `prisma/seed.js` are now mirrored in both the source seed (`prisma/seeds/seed.json`) and the compiled deployment artifact (`dist/prisma/seed.common.js`). The bundle covers branding, complaint automation, contact details, mapping metadata, and notification controls with `isActive: true` defaults for consistent rollouts.

### 🖥️ Application Settings
- `APP_NAME = "NLC-CMS"`
- `APP_LOGO_URL = "/logo.png"`
- `APP_LOGO_SIZE = "medium"`
- `SYSTEM_VERSION = "1.0.4"`
- `SYSTEM_MAINTENANCE = false`
- `MAINTENANCE_MODE = false`

### 📝 Complaint Management
- `COMPLAINT_ID_PREFIX = "KSC"`
- `COMPLAINT_ID_START_NUMBER = 1`
- `COMPLAINT_ID_LENGTH = 4`
- `DEFAULT_SLA_HOURS = 48`
- `COMPLAINT_PRIORITIES = ["LOW","MEDIUM","HIGH","CRITICAL"]`
- `COMPLAINT_STATUSES = ["REGISTERED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","REOPENED"]`
- `AUTO_ASSIGN_COMPLAINTS = true`
- `GUEST_COMPLAINT_ENABLED = true`

### 📞 Contact Information
- `CONTACT_HELPLINE = "+91-484-2668222"`
- `CONTACT_EMAIL = "support@cochinsmart.gov.in"`
- `CONTACT_OFFICE_HOURS = "Monday to Friday: 9:00 AM - 5:00 PM"`
- `CONTACT_OFFICE_ADDRESS = "Cochin Smart City Limited, Marine Drive, Ernakulam, Kochi - 682031, Kerala, India"`
- `ADMIN_EMAIL = "admin@cochinsmart.gov.in"`

### 📂 File Upload Settings
- `MAX_FILE_SIZE_MB = 10`
- `COMPLAINT_PHOTO_MAX_SIZE = 5`
- `COMPLAINT_PHOTO_MAX_COUNT = 5`

### 🔔 Notification Settings
- `NOTIFICATION_SETTINGS = { email: true, sms: false }`
- `EMAIL_NOTIFICATIONS_ENABLED = true`
- `SMS_NOTIFICATIONS_ENABLED = false`

### 🗺️ Map Configuration
- `MAP_SEARCH_PLACE = "Kochi, Kerala, India"`
- `MAP_COUNTRY_CODES = "in"`
- `MAP_DEFAULT_LAT = 9.9312`
- `MAP_DEFAULT_LNG = 76.2673`
- `MAP_BBOX_NORTH = 10.05`
- `MAP_BBOX_SOUTH = 9.85`
- `MAP_BBOX_EAST = 76.39`
- `MAP_BBOX_WEST = 76.20`

### 🔐 Security & Access
- `OTP_EXPIRY_MINUTES = 5`
- `CITIZEN_REGISTRATION_ENABLED = true`

### ⚙️ System Automation
- `AUTO_CLOSE_RESOLVED_COMPLAINTS = true`
- `AUTO_CLOSE_DAYS = 7`

## 🏘️ Added Wards
Eight active wards are seeded to cover the Kochi deployment footprint:
1. Ward 1 - Fort Kochi 🏰
2. Ward 2 - Mattancherry 🏛️
3. Ward 3 - Ernakulam South 🌆
4. Ward 4 - Kadavanthra 🏙️
5. Ward 5 - Panampilly Nagar 🏢
6. Ward 6 - Marine Drive 🌊
7. Ward 7 - Willingdon Island 🏝️
8. Ward 8 - Thevara 🚤

## 📝 Added Complaint Types
The seed file provisions the following complaint catalog so SLA dashboards and priority filters work on first boot:

| Complaint Type | Priority | SLA (Hours) | Description |
| --- | --- | --- | --- |
| Water Supply 💧 | HIGH | 24 | Issues related to water supply |
| Electricity ⚡ | HIGH | 12 | Power outages |
| Road Repair 🛣️ | MEDIUM | 72 | Damaged roads |
| Waste Management 🗑️ | MEDIUM | 48 | Garbage collection |
| Street Lighting 💡 | LOW | 48 | Street lights |
| Drainage 🌊 | HIGH | 24 | Blocked drains |

## 🔧 Implementation Details

### 📄 Files Updated
- `prisma/seeds/seed.json` – Source JSON consumed during development seeding
- `prisma/seed.js` – Loader that ingests the JSON file using upserts
- `dist/prisma/seed.common.js` – Compiled seed used in release/build deployments (mirrors the same payload)

### 🧩 Seeding Strategy
- Uses `upsert` to avoid duplicate inserts
- Non-destructive (preserves existing production data)
- Marks every record with `isActive: true`
- Keeps descriptions synchronized for documentation and API consumers

### 🗄️ Database Impact
- Populates `system_config`, `wards`, `complaint_types`, and `sub_zones`
- Indexes rely on `key` (configs) and `name` (wards/types)
- Supports SLA/priority reporting and citizen onboarding flows immediately after seeding

## ✅ Benefits
- 🗂️ Complete system initialization with 38 configuration keys
- ❌ No missing configuration warnings during boot
- ⚙️ Default automation (auto-assign, auto-close) enabled by default
- 📝 Ready for API/Frontend usage without manual data entry
- 🔧 Easy maintenance with centralized JSON definitions

## 🚀 Usage

### Seeding Command
```bash
# Run from repository root (development)
npm run db:seed

# Run from release build (production bundle)
cd dist
npm run db:seed
```

### API Access
- `GET /api/system-config/public`
- `GET /api/system-config/:key`
- `GET /api/wards`
- `GET /api/complaint-types`

### Frontend Example
```javascript
const helpline = systemConfig.CONTACT_HELPLINE;
const wards = await fetch("/api/wards").then((res) => res.json());
const complaintTypes = await fetch("/api/complaint-types").then((res) => res.json());
```

## 📋 Server Log Confirmation
```
✅ Seeded 38 system configurations
✅ Seeded 8 wards
✅ Seeded 6 complaint types
```

## 🔒 Production Ready
- ✅ Configurations, wards, and complaint types fully seeded
- ✅ Source and dist seed files synchronized during build packaging
- ✅ Ready for API and UI integration on first deploy
