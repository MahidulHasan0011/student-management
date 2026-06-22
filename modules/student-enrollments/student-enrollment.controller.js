import { studentEnrollmentService } from "./student-enrollment.service.js";
import { successResponse } from "../../utils/response.js";

export const studentEnrollmentController = {
  async create(req, res, next) {
    try {
      const data = await studentEnrollmentService.create(req.body);
      return successResponse(res, { message: "Student enrolled", data, statusCode: 201 });
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { data, meta } = await studentEnrollmentService.getAll(req.query);
      return successResponse(res, { message: "Enrollments fetched", data, meta });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await studentEnrollmentService.getById(req.params.id);
      return successResponse(res, { message: "Enrollment fetched", data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await studentEnrollmentService.update(req.params.id, req.body);
      return successResponse(res, { message: "Enrollment updated", data });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await studentEnrollmentService.delete(req.params.id);
      return successResponse(res, { message: "Enrollment deleted" });
    } catch (err) { next(err); }
  },
};