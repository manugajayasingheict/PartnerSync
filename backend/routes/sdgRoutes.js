const express = require('express');
const router = express.Router();
const {
  createSDG,
  getAllSDGs,
  updateSDG,
  deleteSDG,
  syncWithUN,
  getSDGById
} = require('../controllers/sdgController');

// CRUD operations
router.post('/create', createSDG);
router.get('/all', getAllSDGs);
router.get('/:id', getSDGById);
router.put('/update/:id', updateSDG);
router.delete('/delete/:id', deleteSDG);

// UN Sync
router.post('/sync-un', syncWithUN);

module.exports = router;