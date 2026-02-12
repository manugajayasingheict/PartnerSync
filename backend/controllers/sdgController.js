const SDG = require('../models/sdgModel');
const axios = require('axios');

// Create new SDG target
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

// Get all SDG targets
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

// Get single SDG by ID
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
    res.status(500).json({
      success: false,
      message: 'Error fetching SDG target',
      error: error.message
    });
  }
};

// Update SDG target
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

// Delete SDG target
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

// COOL FEATURE - Sync with UN API
exports.syncWithUN = async (req, res) => {
  try {
    console.log('Starting UN sync...');
    
    // UN API endpoint
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

    let syncedCount = 0;
    let updatedCount = 0;
    const targets = Array.isArray(response.data) ? response.data : [response.data];

    console.log(`Processing ${targets.length} targets from UN...`);

    for (const target of targets) {
      if (!target.code && !target.target) continue;

      const targetData = {
        targetNumber: target.code || target.target,
        title: target.title || 'No title available',
        description: target.description || target.title || 'No description available',
        isOfficialUN: true,
        lastSynced: new Date()
      };

      const existing = await SDG.findOne({ targetNumber: targetData.targetNumber });

      if (existing) {
        await SDG.findByIdAndUpdate(existing._id, targetData);
        updatedCount++;
      } else {
        await SDG.create(targetData);
        syncedCount++;
      }
    }

    console.log(`Sync complete: ${syncedCount} new, ${updatedCount} updated`);

    res.status(200).json({
      success: true,
      message: 'Successfully synced with UN Global Standards',
      stats: {
        newTargets: syncedCount,
        updatedTargets: updatedCount,
        totalProcessed: syncedCount + updatedCount
      }
    });

  } catch (error) {
    console.error('UN Sync Error:', error.message);
    
    // If UN API is down, create sample data
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      try {
        // Create sample Goal 17 targets
        const sampleTargets = [
          {
            targetNumber: '17.1',
            title: 'Strengthen domestic resource mobilization',
            description: 'Strengthen domestic resource mobilization, including through international support to developing countries, to improve domestic capacity for tax and other revenue collection',
            isOfficialUN: false
          },
          {
            targetNumber: '17.2',
            title: 'Implement all development assistance commitments',
            description: 'Developed countries to implement fully their official development assistance commitments',
            isOfficialUN: false
          },
          {
            targetNumber: '17.3',
            title: 'Mobilize additional financial resources',
            description: 'Mobilize additional financial resources for developing countries from multiple sources',
            isOfficialUN: false
          }
        ];

        let created = 0;
        for (const target of sampleTargets) {
          const existing = await SDG.findOne({ targetNumber: target.targetNumber });
          if (!existing) {
            await SDG.create(target);
            created++;
          }
        }

        return res.status(200).json({
          success: true,
          message: 'UN API unavailable. Created sample targets instead.',
          stats: {
            newTargets: created,
            updatedTargets: 0,
            totalProcessed: created
          }
        });
      } catch (sampleError) {
        return res.status(500).json({
          success: false,
          message: 'UN API unavailable and failed to create sample data',
          error: sampleError.message
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error syncing with UN',
      error: error.message
    });
  }
};