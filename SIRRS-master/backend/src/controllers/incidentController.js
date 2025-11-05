const { Incident, User } = require('../models');
const { categorize } = require('../utils/aiCategorizer');
const { Op } = require('sequelize');

// ------------------------ CREATE INCIDENT ------------------------
exports.createIncident = async (req, res) => {
  try {
    const { title, description, category, lat, lng, address, deadline } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const finalCategory = category || categorize(description);

    const photoUrls = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const incident = await Incident.create({
      title,
      description,
      category: finalCategory,
      photos: photoUrls,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      address,
      reporterId: req.user.id,
      deadline: deadline ? new Date(deadline) : null,
      timeline: [
        {
          status: 'pending',
          note: 'Incident reported',
          updatedBy: req.user.id,
          timestamp: new Date()
        }
      ]
    });

    const populatedIncident = await Incident.findByPk(incident.id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['name', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      incident: populatedIncident,
      aiSuggestion: !category ? finalCategory : null
    });
  } catch (error) {
    console.error('❌ createIncident error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ GET ALL INCIDENTS ------------------------
exports.getIncidents = async (req, res) => {
  try {
    console.log('🔎 /api/incidents hit by', req.user?.email, req.user?.role);

    const { status, category, page = 1, limit = 20 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;

    // citizens can only see their own
    if (req.user.role === 'citizen') where.reporterId = req.user.id;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: incidents } = await Incident.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    console.log('✅ getIncidents return', incidents.length, 'records');

    res.json({
      success: true,
      incidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ getIncidents error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ GET SINGLE INCIDENT ------------------------
exports.getIncident = async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['name', 'email', 'phone']
      }]
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (
      req.user.role === 'citizen' &&
      incident.reporterId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized to view this incident' });
    }

    res.json({ success: true, incident });
  } catch (error) {
    console.error('❌ getIncident error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ UPDATE STATUS ------------------------
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // Update status
    incident.status = status;
    
    // Add to timeline
    const timeline = incident.timeline || [];
    timeline.push({
      status,
      note: note || `Status changed to ${status}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });
    incident.timeline = timeline;

    await incident.save();

    const updatedIncident = await Incident.findByPk(incident.id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['name', 'email']
      }]
    });

    res.json({ success: true, incident: updatedIncident });
  } catch (error) {
    console.error('❌ updateStatus error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ UPLOAD RESOLUTION PHOTOS ------------------------
exports.uploadResolutionPhotos = async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const photoUrls = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const resolutionPhotos = incident.resolutionPhotos || [];
    resolutionPhotos.push(...photoUrls);
    incident.resolutionPhotos = resolutionPhotos;

    await incident.save();

    res.json({ success: true, photos: photoUrls, incident });
  } catch (error) {
    console.error('❌ uploadResolutionPhotos error:', error);
    res.status(500).json({ error: error.message });
  }
};