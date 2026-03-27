import express from "express";
import {
  getSavedReports,
  getSavedReportById,
  createSavedReport,
  updateSavedReport,
  rerunSavedReport,
  deleteSavedReport
} from "../controllers/savedReportController.js";

const router = express.Router();

router.route("/")
  .get(getSavedReports)
  .post(createSavedReport);

router.route("/:id")
  .get(getSavedReportById)
  .put(updateSavedReport)
  .delete(deleteSavedReport);

router.post("/:id/rerun", rerunSavedReport);

export default router;
