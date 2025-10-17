// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import type { IncomingMessage, ServerResponse, ClientRequest } from "http";

// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => {
//   // Load .env values for this mode
//   const envVars = loadEnv(mode, process.cwd(), "");

//   // Detect cloud environment
//   const isCloudEnvironment =
//     process.env.FLY_APP_NAME ||
//     process.env.RENDER ||
//     process.env.RAILWAY_PROJECT_ID ||
//     process.env.VERCEL ||
//     process.env.NETLIFY;

//   // Resolve client server host/port from env (with sensible defaults)
//   const clientHost =
//     envVars.VITE_CLIENT_HOST ||
//     envVars.VITE_HOST ||
//     envVars.CLIENT_HOST ||
//     envVars.HOST ||
//     "0.0.0.0";
//   const clientPort = Number(
//     envVars.VITE_CLIENT_PORT ||
//       envVars.VITE_PORT ||
//       envVars.CLIENT_PORT ||
//       envVars.PORT_CLIENT ||
//       3000,
//   );
//   const hmrPort = Number(
//     envVars.VITE_HMR_PORT ||
//       envVars.HMR_PORT ||
//       envVars.WS_PORT ||
//       clientPort + 1,
//   );

//   // Resolve API backend target
//   const backendPort = Number(
//     envVars.BACKEND_PORT ||
//       envVars.SERVER_PORT ||
//       envVars.API_PORT ||
//       envVars.PORT ||
//       4005,
//   );
//   const explicitApiUrl =
//     envVars.VITE_PROXY_TARGET ||
//     envVars.PROXY_TARGET ||
//     envVars.API_URL ||
//     envVars.VITE_API_URL ||
//     envVars.REACT_APP_API_URL ||
//     envVars.BACKEND_URL ||
//     envVars.SERVER_URL;
//   const apiHost = envVars.API_HOST || envVars.SERVER_HOST || "localhost";
//   const proxyTarget = explicitApiUrl || `http://${apiHost}:${backendPort}`;
//   const isProduction = mode === "production" || isCloudEnvironment;

//   return {
//     server: {
//       host: clientHost,
//       port: clientPort,
//       fs: {
//         allow: [
//           "./client",
//           "./shared",
//           path.resolve(__dirname, "./node_modules/leaflet/dist"),
//           path.resolve(__dirname, "./uploads"),
//         ],
//         deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
//       },
//       proxy: {
//         // Proxy API calls to the backend server
//         "/api": {
//           target: proxyTarget,
//           changeOrigin: true,
//           secure: false,
//           timeout: 30000,
//           headers: {
//             Connection: "keep-alive",
//           },
//           onError: (err: Error, _req: IncomingMessage, res: ServerResponse) => {
//             console.error("Proxy error:", err.message);
//             if (res.writeHead) {
//               res.writeHead(500, {
//                 "Content-Type": "application/json",
//               });
//               res.end(
//                 JSON.stringify({
//                   success: false,
//                   message: "Proxy connection failed",
//                   error: err.message,
//                 }),
//               );
//             }
//           },
//           onProxyReq: (
//             proxyReq: ClientRequest,
//             req: IncomingMessage,
//             _res: ServerResponse,
//           ) => {
//             console.log(
//               "Proxying request:",
//               req.method,
//               req.url,
//               "-> " + proxyTarget + req.url,
//             );
//           },
//         },
//       },
//       hmr: isProduction
//         ? false
//         : {
//             overlay: false,
//             host: clientHost,
//             port: hmrPort,
//             clientPort: hmrPort,
//           },
//       watch: {
//         usePolling: false,
//         interval: 1000,
//       },
//     },
//     build: {
//       outDir: "dist/spa",
//     },
//     plugins: [react()],
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "./client"),
//         "@shared": path.resolve(__dirname, "./shared"),
//       },
//     },
//     define: {
//       // Fix React runtime issues
//       global: "globalThis",
//       // Ensure consistent NODE_ENV usage in client code
//       "process.env.NODE_ENV": JSON.stringify(
//         isProduction ? "production" : "development",
//       ),
//     },
//     optimizeDeps: {
//       include: ["react", "react-dom"],
//     },
//   };
// });
import { defineConfig, loadEnv, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import type { IncomingMessage, ServerResponse, ClientRequest } from "http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = loadEnv(mode, process.cwd(), "");

  const isCloudEnvironment =
    process.env.FLY_APP_NAME ||
    process.env.RENDER ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.VERCEL ||
    process.env.NETLIFY;

  const clientHost =
    envVars.VITE_CLIENT_HOST ||
    envVars.VITE_HOST ||
    envVars.CLIENT_HOST ||
    envVars.HOST ||
    "0.0.0.0";
  const clientPort = Number(
    envVars.VITE_CLIENT_PORT ||
      envVars.VITE_PORT ||
      envVars.CLIENT_PORT ||
      envVars.PORT_CLIENT ||
      3000,
  );
  const hmrPort = Number(
    envVars.VITE_HMR_PORT ||
      envVars.HMR_PORT ||
      envVars.WS_PORT ||
      clientPort + 1,
  );

  const backendPort = Number(
    envVars.BACKEND_PORT ||
      envVars.SERVER_PORT ||
      envVars.API_PORT ||
      envVars.PORT ||
      4005,
  );
  const explicitApiUrl =
    envVars.VITE_PROXY_TARGET ||
    envVars.PROXY_TARGET ||
    envVars.API_URL ||
    envVars.VITE_API_URL ||
    envVars.REACT_APP_API_URL ||
    envVars.BACKEND_URL ||
    envVars.SERVER_URL;
  const apiHost = envVars.API_HOST || envVars.SERVER_HOST || "localhost";
  const proxyTarget = explicitApiUrl || `http://${apiHost}:${backendPort}`;
  const isProduction = mode === "production" || isCloudEnvironment;
  const projectRoot = path.dirname(fileURLToPath(new URL(".", import.meta.url)));
  const workspaceRoot = searchForWorkspaceRoot(process.cwd());
  const fsAllow = Array.from(
    new Set([
      projectRoot,
      workspaceRoot,
      path.resolve(projectRoot, "index.html"),
      path.resolve(projectRoot, "client"),
      path.resolve(projectRoot, "shared"),
      path.resolve(projectRoot, "uploads"),
      path.resolve(projectRoot, "node_modules/leaflet/dist"),
      path.resolve(projectRoot, "node_modules/vite/dist/client"),
    ]),
  );

  return {
    server: {
      host: clientHost,
      port: clientPort,
      fs: {
        allow: [
          ...fsAllow,
          path.resolve(projectRoot, "client/templates"), // Allow access to templates
        ],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 30000,
          headers: {
            Connection: "keep-alive",
          },
          onError: (err: Error, _req: IncomingMessage, res: ServerResponse) => {
            console.error("Proxy error:", err.message);
            if (res.writeHead) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  success: false,
                  message: "Proxy connection failed",
                  error: err.message,
                }),
              );
            }
          },
          onProxyReq: (
            proxyReq: ClientRequest,
            req: IncomingMessage,
            _res: ServerResponse,
          ) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              "-> " + proxyTarget + req.url,
            );
          },
        },
      },
      hmr: isProduction
        ? false
        : {
            overlay: false,
            host: clientHost,
            port: hmrPort,
            clientPort: hmrPort,
          },
      watch: {
        usePolling: false,
        interval: 1000,
      },
    },
    build: {
      outDir: "dist/spa",
      sourcemap: isProduction ? false : true,
      minify: "terser",
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }
              if (id.includes("leaflet")) {
                return "vendor-leaflet";
              }
              if (
                id.includes("jspdf") ||
                id.includes("xlsx") ||
                id.includes("html2canvas")
              ) {
                return "vendor-heavy";
              }
              return "vendor";
            }
          },
        },
      },
    },
    ssr: {
      noExternal: ["react", "react-dom"], // ensures server build bundles these
    },
    plugins: [
      react(),
      // Template plugin to copy templates to public folder and enable hot reload
      {
        name: 'template-plugin',
        configureServer(server) {
          // Watch template files for changes
          server.watcher.add(path.resolve(projectRoot, 'client/templates/**/*.html'));
          
          server.middlewares.use('/templates', (req, res, next) => {
            // Serve template files from client/templates
            const templatePath = path.join(projectRoot, 'client', req.url || '');
            
            if (templatePath.endsWith('.html')) {
              try {
                const fs = require('fs');
                const content = fs.readFileSync(templatePath, 'utf-8');
                res.setHeader('Content-Type', 'text/html');
                res.end(content);
              } catch (error) {
                res.statusCode = 404;
                res.end('Template not found');
              }
            } else {
              next();
            }
          });
        },
        generateBundle() {
          // Copy templates to dist folder during build
          const fs = require('fs');
          const glob = require('glob');
          
          try {
            const templateDir = path.resolve(projectRoot, 'client/templates');
            const templates = glob.sync('**/*.html', { cwd: templateDir });
            
            templates.forEach(template => {
              const templatePath = path.join(templateDir, template);
              const content = fs.readFileSync(templatePath, 'utf-8');
              
              this.emitFile({
                type: 'asset',
                fileName: `templates/${template}`,
                source: content
              });
            });
          } catch (error) {
            console.warn('Failed to copy templates:', error.message);
          }
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    define: {
      global: "globalThis",
      "process.env.NODE_ENV": JSON.stringify(
        isProduction ? "production" : "development",
      ),
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
    // 👇 Extra build config for server
    worker: {
      format: "es",
    },
  };
});
