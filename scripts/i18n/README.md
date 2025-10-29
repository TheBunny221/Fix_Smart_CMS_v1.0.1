# I18n Audit Infrastructure

Comprehensive system for auditing internationalization coverage across React applications and Node.js backends.

## Overview

This audit infrastructure provides systematic analysis of hardcoded strings, role-based component mapping, and comprehensive reporting to facilitate systematic i18n conversion.

## Features

- **Role-Based Component Mapping**: Maps user roles to accessible routes and components
- **Hardcoded String Detection**: Advanced AST-based detection of user-facing strings
- **Server Message Scanning**: Specialized scanning for backend response messages
- **Comprehensive Reporting**: Multi-format reports (JSON, Markdown, CSV)
- **Conversion Planning**: Prioritized task lists with effort estimates
- **Cross-Reference Analysis**: Role-component-string associations

## Quick Start

### Prerequisites

```bash
# Install dependencies
cd scripts/i18n
npm install
```

### Run Complete Audit

```bash
# Run comprehensive audit (recommended)
npm run audit

# Or run individual components
npm run audit:basic      # Basic infrastructure audit
npm run audit:strings    # Hardcoded string detection
npm run audit:reports    # Generate reports only
```

## Output Structure

```
scripts/i18n/audit-results/
├── audit-session.json                    # Session metadata
├── role-component-mapping.json           # Role mappings
├── component-scan-results.json           # Component analysis
├── file-system-analysis.json             # Project structure
├── structured-data/
│   ├── structured-hardcoded-strings.json # Complete string data
│   ├── conversion-plan.json              # Prioritized tasks
│   └── role-reports/                     # Role-specific reports
├── comprehensive-reports/
│   ├── executive-summary.json            # High-level overview
│   ├── role-audit-matrix.json            # Role analysis
│   ├── technical-audit-report.json       # Technical details
│   ├── markdown-reports/                 # Human-readable reports
│   └── csv-exports/                      # Spreadsheet data
└── integrated-outputs/
    ├── master-audit-report.json          # Complete audit data
    ├── executive-dashboard.json           # Dashboard metrics
    ├── implementation-roadmap.json        # Step-by-step plan
    └── quick-start-guide.md               # Getting started guide
```

## Key Components

### 1. Role-Based Component Mapper

Maps user roles to accessible components and routes:

- ADMINISTRATOR: Full system access
- WARD_OFFICER: Ward-scoped access
- MAINTENANCE_TEAM: Task-scoped access
- CITIZEN: User-scoped access
- GUEST: Public access

### 2. Hardcoded String Detector

Detects various types of hardcoded strings:

- JSX text content
- JSX attributes (placeholder, title, alt, etc.)
- Object properties (labels, messages)
- Template literals
- Server response messages

### 3. Server Message Scanner

Specialized scanning for backend files:

- API response messages
- Validation error messages
- Email subjects and content
- Authentication messages
- Database error messages

### 4. Audit Reporting System

Generates comprehensive reports:

- Executive summaries
- Technical deep dives
- Role-wise matrices
- Conversion guides
- Statistics dashboards

## Usage Examples

### Basic Audit

```javascript
const { I18nAuditOrchestrator } = require("./audit-main");
const orchestrator = new I18nAuditOrchestrator();
await orchestrator.runCompleteAudit();
```

### String Detection Only

```javascript
const { HardcodedStringDetector } = require("./hardcoded-string-detector");
const detector = new HardcodedStringDetector();
const results = detector.scanDirectory("./client");
```

### Role Mapping

```javascript
const { RoleBasedComponentMapper } = require("./audit-infrastructure");
const mapper = new RoleBasedComponentMapper();
const matrix = mapper.generateRoleComponentMatrix();
```

## Configuration

### File Type Extensions

Default extensions scanned: `.tsx`, `.jsx`, `.ts`, `.js`

### Exclude Patterns

Default exclusions: `node_modules`, `__tests__`, `.test.`, `.spec.`, `dist`, `build`

### User Roles

Configured roles: `ADMINISTRATOR`, `WARD_OFFICER`, `MAINTENANCE_TEAM`, `CITIZEN`, `GUEST`

## Report Types

### Executive Summary

- Key metrics and KPIs
- Risk assessment
- Business impact analysis
- Actionable recommendations

### Role Audit Matrix

- Role-based string distribution
- Component coverage by role
- Translation gaps identification
- Priority matrices

### Technical Report

- Codebase analysis
- Implementation status
- Conversion complexity
- Quality assurance requirements

### Conversion Plan

- Prioritized task lists
- Effort estimates
- Impact assessments
- Implementation phases

## Best Practices

### Before Running Audit

1. Ensure clean working directory
2. Update dependencies
3. Verify project structure

### After Audit

1. Review executive summary first
2. Focus on high-priority tasks
3. Address critical issues immediately
4. Plan systematic conversion phases

### During Conversion

1. Follow recommended task order
2. Test each component thoroughly
3. Update translation files consistently
4. Validate role-based access

## Troubleshooting

### Common Issues

**Parsing Errors**

- Ensure valid JavaScript/TypeScript syntax
- Check for missing dependencies
- Verify file encoding (UTF-8)

**Missing Components**

- Update role mappings if new components added
- Check component naming conventions
- Verify file paths are correct

**Performance Issues**

- Reduce scan depth for large projects
- Use exclude patterns for unnecessary files
- Run audit on smaller directory subsets

### Debug Mode

Set `NODE_ENV=development` for detailed logging and debug information.

## Contributing

### Adding New String Types

1. Update detection patterns in `hardcoded-string-detector.js`
2. Add corresponding severity calculations
3. Update report generation logic

### Adding New Roles

1. Update role mappings in `audit-infrastructure.js`
2. Add role-specific component associations
3. Update report templates

### Extending Reports

1. Add new report types to `audit-reporting-system.js`
2. Create corresponding templates
3. Update orchestrator integration

## API Reference

### Main Classes

#### I18nAuditOrchestrator

Main orchestrator for complete audit process.

#### RoleBasedComponentMapper

Maps user roles to accessible components and routes.

#### HardcodedStringDetector

Detects hardcoded strings in React components.

#### ServerMessageScanner

Scans server files for hardcoded messages.

#### StructuredDataGenerator

Generates structured data with role associations.

#### AuditReportingSystem

Creates comprehensive reports in multiple formats.

### Key Methods

```javascript
// Run complete audit
await orchestrator.runCompleteAudit();

// Generate role mappings
const matrix = mapper.generateRoleComponentMatrix();

// Detect strings in component
const result = detector.detectInReactComponent(filePath);

// Scan server directory
const results = scanner.scanServerDirectory(serverPath);

// Generate structured data
const data = generator.generateStructuredData(projectRoot);

// Create reports
const reports = reporter.generateComprehensiveReports(data, outputDir);
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check troubleshooting section
2. Review generated reports for guidance
3. Examine debug logs in development mode
4. Consult technical documentation in reports

---

_Generated by I18n Audit Infrastructure v1.0.0_
