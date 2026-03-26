import SavedReport from "../models/SavedReport.js";

// @route   GET /api/saved-reports
export const getSavedReports = async (req, res) => {
  try {
    const reports = await SavedReport.find().sort({ createdAt: -1 });
    // Transform to match frontend expected structure
    const data = reports.map(r => ({
      id: r._id.toString(),
      name: r.name,
      type: r.type,
      department: r.department || r.courseName || "",
      dateCreated: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
      config: r.config
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/saved-reports
export const createSavedReport = async (req, res) => {
  try {
    const { name, type, courseName, department, config } = req.body;
    const report = new SavedReport({
      name,
      type,
      courseName,
      department,
      config
    });
    const saved = await report.save();
    
    res.status(201).json({ 
      success: true, 
      data: {
        id: saved._id.toString(),
        name: saved.name,
        type: saved.type,
        department: saved.department || saved.courseName || "",
        dateCreated: new Date(saved.createdAt).toLocaleDateString(),
        config: saved.config
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/saved-reports/:id
export const updateSavedReport = async (req, res) => {
  try {
    const { name, type, courseName, department, config } = req.body;
    const updated = await SavedReport.findByIdAndUpdate(
      req.params.id,
      { name, type, courseName, department, config },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: "Report not found" });

    res.json({ 
      success: true, 
      data: {
        id: updated._id.toString(),
        name: updated.name,
        type: updated.type,
        department: updated.department || updated.courseName || "",
        dateCreated: new Date(updated.createdAt).toLocaleDateString(),
        config: updated.config
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/saved-reports/:id
export const deleteSavedReport = async (req, res) => {
  try {
    const deleted = await SavedReport.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Report not found" });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
