# Swagger/OpenAPI Integration Guide
## Fix_Smart_CMS v 1.0.0

### Overview
This document explains how Swagger/OpenAPI documentation is configured and integrated into the Fix_Smart_CMS project. The API documentation is automatically generated from JSDoc comments in route files and served via Swagger UI.

### Configuration

#### Main Configuration File
The Swagger configuration is located in `server/config/swagger.js` and includes:

- **OpenAPI 3.0.3** specification
- Comprehensive schemas for all data models
- Security schemes (JWT Bearer authentication)
- Common parameters and response templates
- Server configurations for different environments

#### Key Features
- **Auto-generated Documentation**: Routes are automatically documented from JSDoc comments
- **Interactive Testing**: Swagger UI allows testing endpoints directly
- **Schema Validation**: Request/response schemas ensure API consistency
- **Role-based Access**: Documentation reflects authentication and authorization requirements

### Accessing Documentation

#### Development Environment
- **Swagger UI**: http://localhost:4005/api-docs
- **JSON Schema**: http://localhost:4005/api/docs/json
- **Health Check**: http://localhost:4005/api/health

#### Production Environment
- **Swagger UI**: https://api.nlc-cms.gov.in/api-docs
- **JSON Schema**: https://api.nlc-cms.gov.in/api/docs/json

### Adding Documentation for New Endpoints

#### 1. Route Documentation Template
```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Brief description of the endpoint
 *     tags: [YourTag]
 *     description: Detailed description of what this endpoint does
 *     security:
 *       - bearerAuth: []  # If authentication required
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource identifier
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Optional filter parameter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourSchema'
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/YourResponseSchema'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

#### 2. Schema Definition Template
```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     YourModel:
 *       type: object
 *       required:
 *         - requiredField1
 *         - requiredField2
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier
 *           example: "model123"
 *         name:
 *           type: string
 *           description: Model name
 *           example: "Example Model"
 *         status:
 *           type: string
 *           enum: ["ACTIVE", "INACTIVE"]
 *           description: Model status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
```

### Model Integration

#### Prisma Schema Mapping
All Prisma models are automatically mapped to Swagger schemas in `server/config/swagger.js`:

- **User**: Complete user model with roles and relationships
- **Complaint**: Full complaint lifecycle with status tracking
- **Ward/SubZone**: Geographic boundary models
- **Attachment**: Unified file attachment system
- **Notification**: In-app notification system
- **SystemConfig**: Configuration management

#### Adding New Models
1. Define the model in `prisma/schema.prisma`
2. Add corresponding Swagger schema in `server/config/swagger.js`
3. Update route documentation to reference the new schema

### Authentication Documentation

#### Security Schemes
```javascript
securitySchemes: {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT token obtained from login endpoint"
  }
}
```

#### Usage in Routes
```javascript
security:
  - bearerAuth: []  # Requires JWT authentication
```

### Common Parameters

#### Pagination
```javascript
parameters:
  - $ref: '#/components/parameters/PageParam'
  - $ref: '#/components/parameters/LimitParam'
  - $ref: '#/components/parameters/SortParam'
```

#### Filtering
```javascript
parameters:
  - $ref: '#/components/parameters/SearchParam'
  - $ref: '#/components/parameters/StatusParam'
  - $ref: '#/components/parameters/PriorityParam'
  - $ref: '#/components/parameters/WardParam'
```

### Response Templates

#### Standard Responses
- `SuccessResponse`: Generic success response
- `ErrorResponse`: Generic error response
- `ValidationError`: Validation failure response
- `UnauthorizedError`: Authentication required
- `ForbiddenError`: Insufficient permissions
- `NotFoundError`: Resource not found
- `ServerError`: Internal server error

### File Upload Documentation

#### Multipart Form Data
```javascript
requestBody:
  required: true
  content:
    multipart/form-data:
      schema:
        type: object
        properties:
          file:
            type: string
            format: binary
          description:
            type: string
      encoding:
        file:
          contentType: image/*, application/pdf
```

### Testing APIs via Swagger UI

#### Steps to Test
1. Navigate to `/api-docs`
2. Click "Authorize" button
3. Enter JWT token: `Bearer <your-token>`
4. Select an endpoint to test
5. Fill in required parameters
6. Click "Execute"
7. Review response

#### Getting JWT Token
1. Use `/api/auth/login` endpoint
2. Copy the token from response
3. Use in Authorization header

### Regenerating Documentation

#### Automatic Updates
Documentation is automatically updated when:
- Server restarts
- Route files are modified
- Schema definitions change

#### Manual Refresh
- Restart the server: `npm run server:dev`
- Clear browser cache
- Refresh `/api-docs` page

### Best Practices

#### Documentation Standards
1. **Always document new endpoints** before merging
2. **Use descriptive summaries** and detailed descriptions
3. **Include realistic examples** in schemas
4. **Reference existing schemas** when possible
5. **Document all parameters** and their purposes
6. **Specify all possible responses** including errors

#### Schema Design
1. **Use consistent naming** conventions
2. **Include validation rules** (required, min/max, patterns)
3. **Provide meaningful examples**
4. **Document relationships** between models
5. **Use enums** for fixed value sets

#### Error Handling
1. **Document all error scenarios**
2. **Use standard HTTP status codes**
3. **Provide helpful error messages**
4. **Include validation error details**

### Troubleshooting

#### Common Issues

**Documentation not updating:**
- Check JSDoc syntax in route files
- Restart the server
- Verify file paths in swagger.js

**Schema validation errors:**
- Check required fields
- Verify data types
- Ensure enum values match

**Authentication issues:**
- Verify JWT token format
- Check token expiration
- Ensure proper Bearer prefix

**Missing endpoints:**
- Check route registration in app.js
- Verify JSDoc comments syntax
- Ensure proper file paths

#### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=swagger* npm run server:dev
```

### Deployment Considerations

#### Production Settings
- Update server URLs in swagger.js
- Ensure HTTPS endpoints
- Configure proper CORS settings
- Set appropriate rate limits

#### Security
- Disable test routes in production
- Implement proper authentication
- Use HTTPS for all endpoints
- Validate all input parameters

### Maintenance

#### Regular Updates
1. **Review documentation** quarterly
2. **Update examples** with real data
3. **Remove deprecated endpoints**
4. **Add new features** promptly
5. **Validate schema accuracy**

#### Version Management
- Update version numbers in swagger.js
- Document breaking changes
- Maintain backward compatibility
- Archive old documentation versions

### Integration with Development Workflow

#### Pre-commit Checks
1. Validate Swagger syntax
2. Check schema completeness
3. Test endpoint documentation
4. Verify examples work

#### CI/CD Pipeline
1. Generate static documentation
2. Deploy to documentation site
3. Run API validation tests
4. Update external integrations

This comprehensive integration ensures that Fix_Smart_CMS maintains high-quality, up-to-date API documentation that serves both developers and API consumers effectively.