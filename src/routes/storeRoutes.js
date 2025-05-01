const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.get('/getAll', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);
router.post('/create', storeController.createStore);
router.delete('/:id', storeController.deleteStore);
router.put('/', storeController.updateStore);

module.exports = router;