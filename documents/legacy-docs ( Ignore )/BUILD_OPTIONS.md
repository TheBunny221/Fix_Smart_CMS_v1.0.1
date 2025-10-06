# NLC-CMS Build Options

This document explains the different build options available for the NLC-CMS project.

## Build Scripts Overview

### 1. TypeScript-Only Build (Server-Only)
```bash
npm run build:server-only
```

**What it does:**
- Compiles TypeScript files to JavaScript
- Does NOT build the client/React application
- Outputs to `tsbuild/` directory
- Runs type checking before compilation
- Generates build report

**Use cases:**
- Server-side development
- API testing
- TypeScript validation
- Quick compilation checks

**Output:**
- `tsbuild/` - Compiled JavaScript files
- `tsbuild-report.json` - Build statistics

### 2. TypeScript Build Test
```bash
npm run build:test-ts
```

**What it does:**
- Tests the existing TypeScript build
- Validates file structure
- Checks compiled file contents
- Reports build statistics

**Use cases:**
- Verify TypeScript compilation
- Debug build issues
- Check build integrity

### 3. Full Production Build
```bash
npm run build
```

**What it does:**
- Compiles TypeScript (server)
- Builds React client application
- Creates unified `dist/` directory
- Copies all necessary files
- Generates production package.json
- Creates deployment documentation

**Use cases:**
- Production deployment
- Complete application build
- Distribution packaging

### 4. Legacy Build
```bash
npm run build:legacy
```

**What it does:**
- Cleans previous builds
- Compiles TypeScript
- Builds client with Vite
- Separate build steps

**Use cases:**
- Debugging build issues
- Step-by-step building

## Build Outputs

### TypeScript-Only Build Output
```
tsbuild/
├── client/           # Compiled client TypeScript
│   ├── App.js
│   ├── main.js
│   └── components/
├── shared/           # Shared code
│   └── api.js
└── vite.config.js    # Compiled config files
```

### Full Production Build Output
```
dist/
├── server/           # Server files
├── client/           # Built React app
├── config/           # Configuration
├── prisma/           # Database files
├── scripts/          # Essential scripts
├── package.json      # Production dependencies
└── README_DEPLOYMENT.md
```

## Performance Comparison

| Build Type | Time | Output Size | Use Case |
|------------|------|-------------|----------|
| TypeScript-Only | ~30s | 1.7 MB | Development |
| Full Production | ~2-3min | 15-20 MB | Production |
| Test Build | ~5s | - | Validation |

## Environment Requirements

### TypeScript-Only Build
- Node.js 18+
- TypeScript compiler
- No additional dependencies

### Full Production Build
- Node.js 18+
- All dev dependencies
- Vite for client build
- Build tools

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors**
   ```bash
   npm run typecheck
   ```

2. **Missing tsbuild directory**
   ```bash
   npm run clean:tsbuild
   npm run build:ts
   ```

3. **Build verification fails**
   ```bash
   npm run build:test-ts
   ```

### Debug Commands

```bash
# Check TypeScript configuration
npx tsc --showConfig

# Validate TypeScript files
npm run typecheck

# Clean all build artifacts
npm run clean:client && npm run clean:tsbuild

# Test individual build steps
npm run build:ts
npm run build:test-ts
```

## Best Practices

1. **Development Workflow**
   - Use `npm run build:server-only` for quick TypeScript validation
   - Use `npm run build:test-ts` to verify builds
   - Use full build only when needed

2. **CI/CD Pipeline**
   - Run `npm run typecheck` first
   - Use `npm run build:server-only` for testing
   - Use `npm run build` for production deployment

3. **Performance Optimization**
   - TypeScript-only builds are 4-5x faster
   - Use for development and testing
   - Reserve full builds for production

## Scripts Reference

```json
{
  "build": "node scripts/build-production.js",
  "build:server-only": "node scripts/build-server-only.js",
  "build:test-ts": "node scripts/test-ts-build.js",
  "build:ts": "tsc --project tsconfig.json",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "clean:tsbuild": "rm -rf tsbuild"
}
```

---

**Last Updated:** October 2025  
**Version:** 1.0.0