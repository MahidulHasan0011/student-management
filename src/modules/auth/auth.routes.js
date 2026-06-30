import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: ইমেইল/পাসওয়ার্ড দিয়ে লগইন
 *     description: সফল হলে user, accessToken ও refreshToken ফেরত দেয়।
 *     security: []   # পাবলিক — টোকেন লাগে না
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: admin@school.com }
 *               password: { type: string, format: password, example: 'Admin@123' }
 *     responses:
 *       200:
 *         description: লগইন সফল
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { type: object }
 *                         accessToken: { type: string }
 *                         refreshToken: { type: string }
 *       401:
 *         description: ইমেইল বা পাসওয়ার্ড ভুল
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: অ্যাকাউন্ট নিষ্ক্রিয়
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: refresh token দিয়ে নতুন access token নেওয়া
 *     description: refresh token rotate হয় — পুরনোটি বাতিল হয়ে নতুন refreshToken আসে।
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: নতুন টোকেন জোড়া
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: string }
 *                         refreshToken: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: লগআউট — server-side refresh token মুছে দেয়
 *     responses:
 *       200:
 *         description: লগআউট সফল
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: বর্তমান লগইন করা ইউজারের তথ্য
 *     responses:
 *       200:
 *         description: ইউজারের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: object }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authMiddleware, authController.me);

export default router;
