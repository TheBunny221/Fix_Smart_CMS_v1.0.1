/**
 * Production Server Build Configuration
 * 
 * This module handles the production build and server setup for deployment.
 * It creates a self-contained server that can run independently with:
 * - Express server configuration
 * - Static file serving for the built React app
 * - Production optimizations and security
 * - Environment variable handling
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import helmet from "helmet";

// Import server routes and middleware
import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import captchaRoutes from "./routes/captchaRoutes.js";

// Import database connection
import connectDB from "./db/connection.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { databaseCheck } from "./middleware/databaseCheck.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Create and configure the Express application
 * @returns {Object} Configured Express app
 */
export function createServer() {
  const app = express();

  // Security middleware - must be first
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Enable gzip compression for all responses
  app.use(compression());

  // Connect to database
  console.log("🔗 Initializing database connection...");
  connectDB();

  // CORS configuration for production
  const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With", 
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  };

  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Custom middleware
  app.use(requestLogger);
  app.use(databaseCheck);

  // Health check endpoint (before other routes)
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is running",
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "production",
      },
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/guest", guestRoutes);
  app.use("/api/captcha", captchaRoutes);

  // Serve static files from the React app build
  const staticPath = path.join(__dirname, "../dist/spa");
  app.use(express.static(staticPath, {
    maxAge: "1d", // Cache static files for 1 day
    etag: true,
    lastModified: true,
  }));

  // Serve uploaded files (if any)
  const uploadsPath = path.join(__dirname, "../uploads");
  app.use("/uploads", express.static(uploadsPath, {
    maxAge: "1h",
    etag: true,
  }));

  // Catch-all handler: send back React's index.html file for SPA routing
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes that don't exist
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({
        success: false,
        message: "API endpoint not found",
        path: req.path,
      });
    }

    // Serve the React app for all other routes
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the production server
 */
function startServer() {
  const app = createServer();
  const port = process.env.PORT || 4005;

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`
🚀 Production server started successfully!

📍 Server Details:
   Port: ${port}
   Environment: ${process.env.NODE_ENV || "production"}
   Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}
   
🌐 Access URLs:
   Local: http://localhost:${port}
   Network: http://0.0.0.0:${port}

💡 Server Features:
   ✅ Security headers (Helmet)
   ✅ Gzip compression
   ✅ Static file serving
   ✅ API routes
   ✅ SPA routing support
   ✅ Error handling
   ✅ Health checks

Ready to accept connections! 🎉
    `);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error("❌ Error during server shutdown:", err);
        process.exit(1);
      }
      
      console.log("✅ Server closed successfully");
      
      // Close database connections if needed
      // mongoose.connection.close(() => {
      //   console.log("✅ Database connection closed");
      //   process.exit(0);
      // });
      
      process.exit(0);
    });
  };

  // Handle shutdown signals
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
  });

  return server;
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

// Export for use in other modules
export { startServer };
export default createServer;
