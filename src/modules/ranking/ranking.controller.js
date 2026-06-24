import { rankingService } from './ranking.service.js';
import { successResponse } from '../../utils/response.js';

export const rankingController = {
  async trigger(req, res, next) {
    try {
      const data = await rankingService.trigger(req.body);
      return successResponse(res, {
        message: 'Ranking job enqueued',
        data,
        statusCode: 202,
      });
    } catch (err) {
      next(err);
    }
  },
};
