const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.post('/create', transactionController.createTransaction);
router.post('/pay/:id', transactionController.payTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.get('/user/:user_id', transactionController.getUserTransactions);

module.exports = router;