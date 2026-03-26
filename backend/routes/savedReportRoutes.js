import express from "express";
import {
  getSavedReports,
  createSavedReport,
  updateSavedReport,
  deleteSavedReport
} from "../controllers/savedReportController.js";

const router = express.Router();

router.route("/")
  .get(getSavedReports)
  .post(createSavedReport);

router.route("/:id")
  .put(updateSavedReport)
  .delete(deleteSavedReport);

export default router;
