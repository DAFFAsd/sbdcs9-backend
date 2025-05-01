const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const upload = require('../middleware/upload');

router.post('/create', upload.single('image'), itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/byId/:id', itemController.getItemById);
router.get('/byStoreId/:store_id', itemController.getItemByStoreId);
router.put('/', upload.single('image'), itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;