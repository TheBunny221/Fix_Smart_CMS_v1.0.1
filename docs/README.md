# Fix_Smart_CMS Documentation Portal

Welcome to the comprehensive documentation system for the Fix_Smart_CMS complaint management application. This portal provides organized access to all project documentation across different departments and specializations.

## 📚 Documentation Departments

### 🧪 [Quality Assurance (QA)](./QA/README.md)
Comprehensive quality assurance documentation, testing procedures, and validation guidelines.

**Key Documents:**
- [Test Cases](./QA/test_cases.md) - Standardized QA test case templates and structure
- [Release Validation](./QA/release_validation.md) - Production release validation checklists
- [Bug Reporting](./QA/bug_reporting.md) - Issue tracking and bug reporting procedures
- [Integration Checklist](./QA/integration_checklist.md) - QA integration testing workflows

**Best For:** QA engineers, testers, release managers, and anyone involved in quality validation.

---

### 👨‍💻 [Developer](./Developer/README.md)
Technical documentation, coding standards, architecture guides, and implementation resources.

**Key Documents:**
- [Architecture Overview](./Developer/architecture_overview.md) - System architecture and component relationships
- [Code Guidelines](./Developer/code_guidelines.md) - Coding standards and review guidelines
- [API Contracts](./Developer/api_contracts.md) - Backend API structure and integration patterns
- [I18n Conversion Guide](./Developer/i18n_conversion_guide.md) - Internationalization implementation guide

**Best For:** Software developers, architects, technical leads, and code reviewers.

---

### 🚀 [Onboarding](./Onboarding/README.md)
New team member resources, setup guides, and getting started documentation.

**Key Documents:**
- [Local Setup](./Onboarding/local_setup.md) - Development environment setup for all platforms
- [Branching Strategy](./Onboarding/branching_strategy.md) - Git workflow and PR submission guidelines
- [Development Tools](./Onboarding/development_tools.md) - Recommended IDEs and development utilities
- [Debugging Tips](./Onboarding/debugging_tips.md) - Troubleshooting and debugging workflows

**Best For:** New team members, interns, contractors, and anyone setting up the development environment.

---

### ⚙️ [System](./System/README.md)
System configuration, environment management, security standards, and operational procedures.

**Key Documents:**
- [System Configuration Overview](./System/system_config_overview.md) - Configuration keys and management
- [Environment Management](./System/env_management.md) - Environment file management and validation
- [Security Standards](./System/security_standards.md) - Security policies and access control
- [Logging & Monitoring](./System/logging_monitoring.md) - Operational monitoring and log management

**Best For:** System administrators, DevOps engineers, security specialists, and operations teams.

---

### 🗄️ [Database](./Database/README.md)
Database schema, migration procedures, performance optimization, and data management.

**Key Documents:**
- [Schema Reference](./Database/schema_reference.md) - Complete Prisma/PostgreSQL schema documentation
- [Migration Guidelines](./Database/migration_guidelines.md) - Schema migration and rollback procedures
- [Seed & Fallback Logic](./Database/seed_fallback_logic.md) - Data seeding and configuration fallback
- [Performance Tuning](./Database/performance_tuning.md) - Database optimization strategies

**Best For:** Database administrators, backend developers, data analysts, and performance engineers.

---

### 🚢 [Deployment](./Deployment/README.md)
Platform-specific deployment guides, infrastructure setup, and production environment management.

**Key Documents:**
- [Linux Deployment](./Deployment/linux_deployment.md) - Linux server deployment with Nginx/Apache
- [Windows Deployment](./Deployment/windows_deployment.md) - Windows Server deployment procedures
- [Reverse Proxy & SSL](./Deployment/reverse_proxy_ssl.md) - HTTPS setup and security configuration
- [PM2 Services](./Deployment/pm2_services.md) - Process management and service configuration
- [Multi-Environment Setup](./Deployment/multi_env_setup.md) - UT/PROD/STG environment configuration

**Best For:** DevOps engineers, system administrators, deployment specialists, and infrastructure teams.

---

## 🔄 Cross-Department Navigation

### Common Workflows

#### **New Developer Onboarding**
1. Start with [Onboarding → Local Setup](./Onboarding/local_setup.md)
2. Review [Developer → Architecture Overview](./Developer/architecture_overview.md)
3. Understand [System → Configuration Overview](./System/system_config_overview.md)
4. Study [Database → Schema Reference](./Database/schema_reference.md)

#### **Feature Development**
1. Review [Developer → Code Guidelines](./Developer/code_guidelines.md)
2. Check [Developer → API Contracts](./Developer/api_contracts.md)
3. Follow [QA → Test Cases](./QA/test_cases.md) for testing
4. Use [QA → Integration Checklist](./QA/integration_checklist.md) for validation

#### **Production Deployment**
1. Follow platform-specific [Deployment](./Deployment/README.md) guide
2. Apply [System → Security Standards](./System/security_standards.md)
3. Configure [System → Logging & Monitoring](./System/logging_monitoring.md)
4. Execute [QA → Release Validation](./QA/release_validation.md)

#### **Database Changes**
1. Plan with [Database → Migration Guidelines](./Database/migration_guidelines.md)
2. Test with [QA → Integration Checklist](./QA/integration_checklist.md)
3. Deploy using [Deployment → Multi-Environment Setup](./Deployment/multi_env_setup.md)
4. Monitor with [System → Logging & Monitoring](./System/logging_monitoring.md)

## 🏗️ Project Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + Prisma ORM
- **Database**: PostgreSQL
- **Testing**: Vitest + React Testing Library + Cypress
- **Deployment**: PM2 + Nginx/Apache + Multi-environment support

### Key Features
- **Multi-Role System**: Admin, Ward Officer, Maintenance Team, Citizen portals
- **Complaint Management**: Full lifecycle complaint tracking and resolution
- **Internationalization**: Multi-language support (English, Hindi, Malayalam)
- **File Management**: Unified attachment system with configurable storage
- **Real-time Notifications**: Email and in-app notification systems
- **Comprehensive Reporting**: Dynamic reporting with role-based access

### System Architecture
The application follows a modern full-stack architecture with:
- **Frontend**: Single-page application with role-based routing
- **Backend**: RESTful API with JWT authentication
- **Database**: Relational database with optimized schema
- **Infrastructure**: Containerized deployment with reverse proxy

## 📖 Documentation Standards

### Navigation Conventions
- **Relative Links**: All internal links use relative paths for compatibility
- **Cross-References**: Each document includes "See Also" sections
- **Consistent Structure**: All departmental folders follow the same organization pattern
- **Index Files**: Every department has a comprehensive README.md index

### Content Organization
- **Hierarchical Structure**: Clear department → document → section organization
- **Cross-Linking**: Related documents are linked across departments
- **Search-Friendly**: Descriptive headings and consistent terminology
- **Version Control**: All documentation is version-controlled with the codebase

## 🆘 Getting Help

### Quick Support Guide
1. **Environment Issues**: Check [Onboarding → Local Setup](./Onboarding/local_setup.md)
2. **Code Questions**: Review [Developer → Code Guidelines](./Developer/code_guidelines.md)
3. **Deployment Problems**: See [Deployment](./Deployment/README.md) guides
4. **Database Issues**: Consult [Database → Migration Guidelines](./Database/migration_guidelines.md)
5. **Testing Questions**: Reference [QA → Test Cases](./QA/test_cases.md)

### Contact Information
- **Technical Issues**: Development team channels
- **Documentation Updates**: Submit PR with documentation changes
- **Process Questions**: Team leads or project managers
- **Security Concerns**: Follow [System → Security Standards](./System/security_standards.md)

## 📈 Documentation Metrics

- **6 Major Departments**: Comprehensive coverage across all specializations
- **25+ Core Documents**: Detailed guides for all major topics
- **Cross-Referenced**: Extensive linking between related documents
- **Multi-Platform**: Deployment guides for Linux and Windows
- **Role-Based**: Content organized by user roles and responsibilities

---

## 📝 Legacy Documentation

Historical documentation and archived files are preserved in [Legacy Documentation](./legacy-doc/README.md) for reference purposes.

---

*This documentation portal is actively maintained and updated with each release. For the most current information, always refer to the latest version in the main branch.*

**Last Updated**: October 2025  
**Documentation Version**: 2.0  
**Application Version**: Compatible with Fix_Smart_CMS v2.x