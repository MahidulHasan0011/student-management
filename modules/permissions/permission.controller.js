import { permissionService } from './permission.service.js';
import { successResponse } from '../../utils/response.js';

export const permissionController = {
  async create(req, res, next) {
    try {
      const data = await permissionService.create(req.body);
      return successResponse(res, { message: 'Permission created', data, statusCode: 201 });
    } catch (err) {
      next(err);
    }
  },
  async getAll(req, res, next) {
    try {
      const { data, meta } = await permissionService.getAll(req.query);
      return successResponse(res, { message: 'Permissions fetched', data, meta });
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const data = await permissionService.getById(req.params.id);
      return successResponse(res, { message: 'Permission fetched', data });
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const data = await permissionService.update(req.params.id, req.body);
      return successResponse(res, { message: 'Permission updated', data });
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      await permissionService.delete(req.params.id);
      return successResponse(res, { message: 'Permission deleted' });
    } catch (err) {
      next(err);
    }
  },
};
