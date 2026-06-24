import { rankingService } from './ranking.service.js';
import { successResponse } from '../../utils/response.js';

export const rankingController = {
  // POST /ranking/generate-roll  { classId, academicSessionId, sectionId? }
  async generateRoll(req, res, next) {
    try {
      const data = await rankingService.triggerRankingAndRoll({
        ...req.body,
        triggeredBy: req.user.userId, // auth.middleware.js থেকে আসা logged-in admin/super_admin
      });
      return successResponse(res, {
        message: "Ranking & roll generation started — this runs in the background",
        data,
        statusCode: 202, // Accepted — কাজ এখনই শেষ হয়নি, queue-তে গেছে
      });
    } catch (err) { next(err); }
  },
};