declare module "./server/routes/authRoutes.js" {
  import type { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./server/routes/complaintRoutes.js" {
  import type { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./server/routes/userRoutes.js" {
  import type { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./server/routes/reportRoutes.js" {
  import type { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./server/routes/guestRoutes.js" {
  import type { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./server/db/connection.js" {
  const connectDB: (...args: any[]) => Promise<unknown> | void;
  export default connectDB;
}

declare module "./server/middleware/errorHandler.js" {
  import type { RequestHandler } from "express";
  export const errorHandler: RequestHandler;
}

declare module "./server/middleware/requestLogger.js" {
  import type { RequestHandler } from "express";
  export const requestLogger: RequestHandler;
}
