// backend/controllers/sdgController.js

const SDG = require('../models/sdgModel');
const axios = require('axios');

// ----------------------------
// Create new SDG target
// ----------------------------
exports.createSDG = async (req, res) => {
  try {
    const { targetNumber, title, description, indicatorCode, benchmark } = req.body;

    const existingSDG = await SDG.findOne({ targetNumber });
    if (existingSDG) {
      return res.status(400).json({ 
        success: false, 
        message: 'This target number already exists' 
      });
    }

    const newSDG = await SDG.create({
      targetNumber,
      title,
      description,
      indicatorCode,
      benchmark,
      category: 'Goal 17'
    });

    res.status(201).json({
      success: true,
      message: 'SDG target created successfully',
      data: newSDG
    });
  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating SDG target',
      error: error.message
    });
  }
};

// ----------------------------
// Get all SDG targets
// ----------------------------
exports.getAllSDGs = async (req, res) => {
  try {
    const sdgs = await SDG.find({ category: 'Goal 17' })
      .select('targetNumber title indicatorCode isOfficialUN description benchmark lastSynced')
      .sort({ targetNumber: 1 });

    res.status(200).json({
      success: true,
      count: sdgs.length,
      data: sdgs
    });
  } catch (error) {
    console.error('Get All Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SDG targets',
      error: error.message
    });
  }
};

// ----------------------------
// Get single SDG by ID
// ----------------------------
exports.getSDGById = async (req, res) => {
  try {
    const { id } = req.params;
    const sdg = await SDG.findById(id);

    if (!sdg) {
      return res.status(404).json({
        success: false,
        message: 'SDG target not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sdg
    });
  } catch (error) {
    console.error('Get By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SDG target',
      error: error.message
    });
  }
};

// ----------------------------
// Update SDG target
// ----------------------------
exports.updateSDG = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, benchmark } = req.body;

    const updatedSDG = await SDG.findByIdAndUpdate(
      id,
      { title, description, benchmark },
      { new: true, runValidators: true }
    );

    if (!updatedSDG) {
      return res.status(404).json({
        success: false,
        message: 'SDG target not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'SDG target updated successfully',
      data: updatedSDG
    });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating SDG target',
      error: error.message
    });
  }
};

// ----------------------------
// Delete SDG target
// ----------------------------
exports.deleteSDG = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSDG = await SDG.findByIdAndDelete(id);

    if (!deletedSDG) {
      return res.status(404).json({
        success: false,
        message: 'SDG target not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'SDG target deleted successfully',
      data: deletedSDG
    });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting SDG target',
      error: error.message
    });
  }
};

// ----------------------------
// Sync with UN API (robust version)
// ----------------------------
exports.syncWithUN = async (req, res) => {
  try {
    console.log('Starting UN sync...');

    const UN_API_URL = 'https://unstats.un.org/sdgapi/v1/sdg/Goal/17/Target/List?includechildren=true';
    const response = await axios.get(UN_API_URL, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SDG-Partnership-App/1.0'
      }
    });

    if (!response.data) {
      return res.status(404).json({
        success: false,
        message: 'No data received from UN API'
      });
    }

    const targets = Array.isArray(response.data) ? response.data : [response.data];

    let syncedCount = 0;
    let updatedCount = 0;
    const failedTargets = [];

    await Promise.allSettled(targets.map(async (target) => {
      try {
        if (!target.code && !target.target) return;

        const targetData = {
          targetNumber: target.code || target.target,
          title: target.title || 'No title available',
          description: target.description || target.title || 'No description available',
          isOfficialUN: true,
          category: 'Goal 17',
          lastSynced: new Date()
        };

        const existing = await SDG.findOne({ targetNumber: targetData.targetNumber });
        if (existing) {
          await SDG.findByIdAndUpdate(existing._id, targetData, { runValidators: true });
          updatedCount++;
        } else {
          await SDG.create(targetData);
          syncedCount++;
        }
      } catch (e) {
        console.error('Failed processing target:', target, e.message);
        failedTargets.push({ targetNumber: target.code || target.target, error: e.message });
      }
    }));

    console.log(`Sync complete: ${syncedCount} new, ${updatedCount} updated, ${failedTargets.length} failed`);

    res.status(200).json({
      success: true,
      message: 'Successfully synced with UN Global Standards',
      stats: {
        newTargets: syncedCount,
        updatedTargets: updatedCount,
        failedTargets: failedTargets,
        totalProcessed: syncedCount + updatedCount + failedTargets.length
      }
    });

  } catch (error) {
    console.error('UN Sync Error:', error.message, error.code);

    // Fallback: create sample targets
    const sampleTargets = [
      { targetNumber: '17.1', title: 'Strengthen domestic resource mobilization', description: 'Support developing countries...', category: 'Goal 17', isOfficialUN: false },
      { targetNumber: '17.2', title: 'Implement all development assistance commitments', description: 'Developed countries to implement...', category: 'Goal 17', isOfficialUN: false },
      { targetNumber: '17.3', title: 'Mobilize additional financial resources', description: 'Mobilize additional financial resources...', category: 'Goal 17', isOfficialUN: false },
      { targetNumber: '17.4', title: 'Promote environmentally sound technologies', description: 'Promote tech transfer to developing countries', category: 'Goal 17', isOfficialUN: false },
      { targetNumber: '17.5', title: 'Enhance international cooperation on science and technology', description: 'Promote knowledge sharing', category: 'Goal 17', isOfficialUN: false },
    ];

    let created = 0;
    for (const target of sampleTargets) {
      const exists = await SDG.findOne({ targetNumber: target.targetNumber });
      if (!exists) {
        await SDG.create(target);
        created++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'UN API unavailable. Created sample targets instead.',
      stats: {
        newTargets: created,
        updatedTargets: 0,
        totalProcessed: created
      }
    });
  }
};