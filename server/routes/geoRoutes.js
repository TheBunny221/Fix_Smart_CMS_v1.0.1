import express from "express";
import rateLimit from "express-rate-limit";
import { reverseGeocode, searchGeocode } from "../controller/geoController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Rate limiting for geo endpoints to prevent abuse
const geoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many geocoding requests from this IP, please try again later.",
    errorCode: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and optional auth to all geo routes
router.use(geoRateLimit);
router.use(optionalAuth);

/**
 * @swagger
 * tags:
 *   name: Geo
 *   description: Geographic and location-based services
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GeoLocation:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *           description: Latitude coordinate
 *           example: 9.9312
 *         longitude:
 *           type: number
 *           description: Longitude coordinate
 *           example: 76.2673
 *         address:
 *           type: string
 *           description: Formatted address
 *           example: "MG Road, Kochi, Kerala, India"
 *         components:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             area:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             postalCode:
 *               type: string
 *         ward:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         accuracy:
 *           type: string
 *           enum: ["HIGH", "MEDIUM", "LOW"]
 *           description: Location accuracy level
 *     
 *     SearchResult:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GeoLocation'
 *         totalResults:
 *           type: integer
 *         searchQuery:
 *           type: string
 */

/**
 * @swagger
 * /api/geo/reverse:
 *   get:
 *     summary: Reverse geocode coordinates to address
 *     tags: [Geo]
 *     description: Convert latitude and longitude coordinates to a human-readable address
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude coordinate
 *         example: 9.9312
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude coordinate
 *         example: 76.2673
 *       - in: query
 *         name: includeWard
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include ward information in response
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GeoLocation'
 *       400:
 *         description: Invalid coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Geocoding service error
 */
router.get("/reverse", reverseGeocode);

/**
 * @swagger
 * /api/geo/search:
 *   get:
 *     summary: Search for locations by address or place name
 *     tags: [Geo]
 *     description: Search for geographic locations using address or place name queries
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *         description: Search query (address, place name, or landmark)
 *         example: "MG Road Kochi"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of results to return
 *       - in: query
 *         name: bounds
 *         schema:
 *           type: string
 *         description: "Bounding box to limit search area (format: lat1,lng1,lat2,lng2)"
 *         example: "9.8,76.1,10.1,76.4"
 *       - in: query
 *         name: includeWard
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include ward information for each result
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SearchResult'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Geocoding service error
 */
router.get("/search", searchGeocode);

export default router;
