import { Router } from 'express';
import { controller } from './exam.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);


router.post("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.createExam);
router.get("/", controller.getExams);
router.put("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.updateExam);
router.delete("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.deleteExam);

export default router;