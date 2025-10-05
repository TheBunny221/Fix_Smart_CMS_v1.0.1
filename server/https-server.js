import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  loadEnvironmentConfig,
  getDatabaseConnection,
  env,
} from "./config/environment.js";
import createApp from "./app.js";
import { initializeDatabase } from "./scripts/initDatabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific configuration
loadEnvironmentConfig();

// Server configuration
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 443;
const HTTP_PORT = Number(process.env.HTTP_PORT) || 80;
const PORT = Number(process.env.PORT) || (env.isProduction ? HTTPS_PORT : 4005);
const HOST = process.env.HOST || "0.0.0.0";

// SSL Configuration
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "../config/ssl/server.key");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, "../config/ssl/server.crt");
const SSL_CA_PATH = process.env.SSL_CA_PATH || path.join(__dirname, "../config/ssl/ca-bundle.crt");
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === "true" || env.isProduction;

/**
 * Check if SSL certificates exist and are valid
 */
function checkSSLCertificates() {
  try {
    if (!fs.existsSync(SSL_KEY_PATH)) {
      console.warn(`⚠️ SSL private key not found: ${SSL_KEY_PATH}`);
      return false;
    }
    
    if (!fs.existsSync(SSL_CERT_PATH)) {
      console.warn(`⚠️ SSL certificate not found: ${SSL_CERT_PATH}`);
      return false;
    }

    // Check if files contain actual certificates (not placeholders)
    const keyContent = fs.readFileSync(SSL_KEY_PATH, 'utf8');
    const certContent = fs.readFileSync(SSL_CERT_PATH, 'utf8');
    
    if (keyContent.includes('# SSL Private Key Placeholder') || 
        certContent.includes('# SSL Certificate Placeholder')) {
      console.warn(`⚠️ SSL certificate files contain placeholders. Please replace with actual certificates.`);
      return false;
    }

    console.log(`✅ SSL certificates found and appear valid`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Error checking SSL certificates: ${error.message}`);
    return false;
  }
}

/**
 * Load SSL certificates
 */
function loadSSLCertificates() {
  try {
    const options = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
    };

    // Add CA bundle if it exists
    if (fs.existsSync(SSL_CA_PATH)) {
      options.ca = fs.readFileSync(SSL_CA_PATH);
      console.log(`✅ CA bundle loaded: ${SSL_CA_PATH}`);
    }

    return options;
  } catch (error) {
    console.error(`❌ Error loading SSL certificates: ${error.message}`);
    throw error;
  }
}

/**
 * Create HTTP redirect server (redirects to HTTPS)
 */
function createHttpRedirectServer() {
  const redirectApp = (req, res) => {
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    console.log(`🔀 Redirecting HTTP to HTTPS: ${req.url} → ${httpsUrl}`);
    
    res.writeHead(301, {
      'Location': httpsUrl,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });
    res.end();
  };

  const httpServer = http.createServer(redirectApp);
  
  httpServer.listen(HTTP_PORT, HOST, () => {
    console.log(`🔀 HTTP redirect server running on http://${HOST}:${HTTP_PORT}`);
    console.log(`   All HTTP traffic will be redirected to HTTPS`);
  });

  return httpServer;
}

/**
 * Start the server with HTTPS support
 */
async function startServer() {
  console.log("🚀 Starting NLC-CMS API Server with HTTPS Support...");
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔧 Node.js version: ${process.version}`);
  console.log(`💾 Database: ${env.isDevelopment ? "SQLite (Development)" : "PostgreSQL (Production)"}`);
  console.log(`🔒 HTTPS Enabled: ${HTTPS_ENABLED}`);

  let databaseConnected = false;
  let app;
  let server;
  let httpRedirectServer;

  try {
    // 1. Initialize and validate database
    console.log("\n🔧 Step 1: Database Initialization");

    try {
      const connectDB = await getDatabaseConnection();
      await connectDB();

      // Initialize database (only for production or when needed)
      if (env.isProduction || process.env.INIT_DB === "true") {
        const dbInitSuccess = await initializeDatabase();
        if (!dbInitSuccess && env.isProduction) {
          throw new Error("Database initialization failed in production");
        }
      }

      databaseConnected = true;
      console.log(`✅ Database connected successfully (${env.isDevelopment ? "SQLite" : "PostgreSQL"})`);
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError.message);

      if (env.isProduction) {
        throw dbError; // Fail in production
      } else {
        console.warn("⚠️ Starting server in development mode without database");
        console.warn("   API endpoints requiring database will return errors");
        console.warn("   Run 'npm run dev:setup' to set up the development database");
        databaseConnected = false;
      }
    }

    // 2. Create Express app
    console.log("\n🔧 Step 2: Express Application Setup");
    app = createApp();

    // 3. Enhanced health check endpoint with database status
    app.get("/api/health/detailed", async (req, res) => {
      let dbStatus = { healthy: false, message: "Database not connected" };

      if (databaseConnected) {
        try {
          const { getDatabaseStatus } = await import("./scripts/initDatabase.js");
          dbStatus = await getDatabaseStatus();
        } catch (error) {
          dbStatus = {
            healthy: false,
            message: "Database status check failed",
            error: error.message,
          };
        }
      }

      const overallHealthy = process.env.NODE_ENV === "development" || databaseConnected;

      res.status(overallHealthy ? 200 : 503).json({
        success: overallHealthy,
        message: overallHealthy
          ? databaseConnected
            ? "All systems operational"
            : "Server running in development mode"
          : "System issues detected",
        data: {
          database: dbStatus,
          server: { healthy: true, message: "Server is running" },
          environment: env.NODE_ENV,
          https: HTTPS_ENABLED,
          ssl: HTTPS_ENABLED ? checkSSLCertificates() : false,
        },
      });
    });

    // 4. Start server with HTTPS support
    console.log("\n🔧 Step 3: Starting HTTP/HTTPS Server");

    if (HTTPS_ENABLED && checkSSLCertificates()) {
      // Start HTTPS server
      const sslOptions = loadSSLCertificates();
      server = https.createServer(sslOptions, app);
      
      server.listen(PORT, HOST, () => {
        console.log("\n🎉 HTTPS Server Successfully Started!");
        console.log("=".repeat(60));
        console.log(`🔒 HTTPS Server URL: https://${HOST}:${PORT}`);
        console.log(`📖 API Documentation: https://${HOST}:${PORT}/api-docs`);
        console.log(`🔍 Health Check: https://${HOST}:${PORT}/api/health`);
        console.log(`📊 Detailed Health: https://${HOST}:${PORT}/api/health/detailed`);
        console.log(`🔒 SSL Status: ✅ Enabled with valid certificates`);
        console.log("=".repeat(60));
      });

      // Start HTTP redirect server if in production
      if (env.isProduction && HTTP_PORT !== PORT) {
        httpRedirectServer = createHttpRedirectServer();
      }

    } else {
      // Start HTTP server (development or missing certificates)
      server = http.createServer(app);
      
      server.listen(PORT, HOST, () => {
        console.log("\n🎉 HTTP Server Successfully Started!");
        console.log("=".repeat(60));
        console.log(`🌐 HTTP Server URL: http://${HOST}:${PORT}`);
        console.log(`📖 API Documentation: http://${HOST}:${PORT}/api-docs`);
        console.log(`🔍 Health Check: http://${HOST}:${PORT}/api/health`);
        console.log(`📊 Detailed Health: http://${HOST}:${PORT}/api/health/detailed`);
        
        if (env.isProduction) {
          console.log(`⚠️ SSL Status: ❌ Running HTTP in production (certificates missing)`);
          console.log(`   Please add SSL certificates to enable HTTPS`);
        } else {
          console.log(`🔓 SSL Status: HTTP mode (development)`);
        }
        console.log("=".repeat(60));
      });
    }

    // 5. Server configuration
    server.keepAliveTimeout = 120000; // 2 minutes
    server.headersTimeout = 120000; // 2 minutes

    // 6. Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 ${signal} received, initiating graceful shutdown...`);

      // Close HTTP redirect server first
      if (httpRedirectServer) {
        httpRedirectServer.close(() => {
          console.log("🔀 HTTP redirect server closed");
        });
      }

      server.close(async (err) => {
        console.log("🔌 HTTPS/HTTP server closed");

        try {
          // Close database connections
          const { getPrisma } = await import("./db/connection.js");
          const prisma = getPrisma();
          await prisma.$disconnect();
          console.log("💾 Database connections closed");

          console.log("✅ Graceful shutdown completed");
          process.exit(err ? 1 : 0);
        } catch (shutdownError) {
          console.error("❌ Error during shutdown:", shutdownError);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error("⏰ Forced shutdown - graceful shutdown timeout");
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Development mode features
    if (env.isDevelopment) {
      console.log("\n🔧 Development Mode Features:");
      console.log(`📋 Test Routes: http://${HOST}:${PORT}/api/test`);
      console.log(`🎯 Database Browser: npm run db:studio:dev`);

      if (!databaseConnected) {
        console.log("\n⚠️ Database Connection Issues:");
        console.log("   • Some API endpoints will return errors");
        console.log("   • Run 'npm run dev:setup' to set up SQLite database");
        console.log("   • Or run 'npm run db:setup:dev' to reset the database");
      }
    }

    console.log(`\n✅ Server is ready to accept connections ${!databaseConnected ? "(limited functionality)" : ""}`);

  } catch (error) {
    console.error("\n❌ Server startup failed:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check database connection and permissions");
    console.error("2. Verify all environment variables are set");
    console.error("3. Ensure required ports are available");
    console.error("4. Check SSL certificates if using HTTPS");
    console.error("5. Check application logs for detailed errors");

    process.exit(1);
  }
}

// Enhanced error handling for production
process.on("uncaughtException", (error) => {
  console.error("\n❌ CRITICAL: Uncaught Exception!");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
  console.error("\n🚨 Application will exit to prevent undefined behavior");

  // Give a brief moment for any pending operations
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ CRITICAL: Unhandled Promise Rejection!");
  console.error("Reason:", reason);
  console.error("Promise:", promise);
  console.error("\n🚨 Application will exit to prevent undefined behavior");

  // Give a brief moment for any pending operations
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Enhanced process monitoring
process.on("warning", (warning) => {
  console.warn("⚠️ Process Warning:");
  console.warn("Name:", warning.name);
  console.warn("Message:", warning.message);
  if (warning.stack) {
    console.warn("Stack:", warning.stack);
  }
});

// Memory usage monitoring (development only)
if (env.isDevelopment) {
  setInterval(() => {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);

    if (usedMB > 500) {
      // Warn if using more than 500MB
      console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
    }
  }, 60000); // Check every minute
}

// Start the server
startServer().catch((error) => {
  console.error("\n❌ Failed to start server:", error);
  process.exit(1);
});

export default createApp;