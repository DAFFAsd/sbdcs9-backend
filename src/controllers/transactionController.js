const pool = require('../database/pg-database');

const createTransaction = async (req, res) => {
    const { item_id, quantity, user_id } = req.body;
    try {
        const itemresult = await pool.query('SELECT * FROM items WHERE id = $1', [item_id]);
        if (itemresult.rows.length === 0) {
            return res.status(404).json({
            success: false,
            message: 'Item not found',
            payload: null,
            });
        }
        if (quantity <= 0){
            return res.status(400).json({
            success: false,
            message: 'quantity must be larger than 0',
            payload: null,
            });
        }
        const result = await pool.query(
            'INSERT INTO transactions (user_id, item_id, quantity, total, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, item_id, quantity, itemresult.rows[0].price * quantity, 'pending']
        );
        res.status(201).json({
        success: true,
        message: 'Transaction created',
        payload: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
        success: false,
        message: 'Internal server error',
        payload: null,
        });
    }
}

const payTransaction = async (req, res) => {
    const id = req.params.id;
    try {
        const transactionresult = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
        if (transactionresult.rows.length === 0) {
            return res.status(404).json({
            success: false,
            message: 'Transaction not found',
            payload: null,
            });
        }
        if (transactionresult.rows[0].status == 'paid'){
            return res.status(400).json({
            success: false,
            message: 'Transaction already paid',
            payload: null,
            });
        }
        const userresult = await pool.query('SELECT * FROM users WHERE id = $1', [transactionresult.rows[0].user_id]);
        if (userresult.rows[0].balance < transactionresult.rows[0].total){
            return res.status(400).json({
            success: false,
            message: 'Failed to pay',
            payload: null,
            });
        }
        
        // Get current item stock
        const itemResult = await pool.query('SELECT stock FROM items WHERE id = $1', [transactionresult.rows[0].item_id]);
        if (itemResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found',
                payload: null,
            });
        }
        
        const currentStock = itemResult.rows[0].stock;
        const newStock = currentStock - transactionresult.rows[0].quantity;
        
        // Check if there's enough stock
        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available',
                payload: null,
            });
        }
        
        const transactionedited = await pool.query('UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *', ['paid', id]);
        await pool.query('UPDATE users SET balance = $1 WHERE id = $2 RETURNING *', [userresult.rows[0].balance - transactionresult.rows[0].total, transactionresult.rows[0].user_id]);
        
        // Update the stock by decreasing it by the purchased quantity
        await pool.query('UPDATE items SET stock = $1 WHERE id = $2 RETURNING *', [newStock, transactionresult.rows[0].item_id]);
        
        return res.status (200).json({
            success: true,
            message: 'Transaction paid',
            payload: transactionedited.rows[0],
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
        success: false,
        message: 'Internal server error',
        payload: null,
        });
    }
}

const deleteTransaction = async (req, res) => {
    const id = req.params.id;
    try {
        console.log(id);
        const deletedresult = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
        await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
        if (deletedresult.rows.length === 0) {
            return res.status(404).json({
            success: false,
            message: 'Transaction not found',
            payload: null,
            });
        }
        res.status(200).json({
            success: true,
            message: 'Transaction deleted',
            payload: deletedresult.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
        success: false,
        message: 'Internal server error',
        payload: null,
        });
    }
}

const getUserTransactions = async (req, res) => {
  const { user_id } = req.params;
  
  try {
    // Query to get transactions with detailed information
    const result = await pool.query(`
      SELECT 
        t.id, 
        t.user_id, 
        t.item_id,
        t.quantity, 
        t.total, 
        t.status, 
        t.created_at,
        i.name as item_name,
        i.image_url as item_image,
        s.id as store_id, 
        s.name as store_name
      FROM 
        transactions t
      JOIN 
        items i ON t.item_id = i.id
      JOIN 
        stores s ON i.store_id = s.id
      WHERE 
        t.user_id = $1
      ORDER BY 
        t.created_at DESC
    `, [user_id]);
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No transactions found for this user',
        payload: [],
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User transactions found',
      payload: result.rows,
    });
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      payload: null,
    });
  }
};

module.exports = {
  createTransaction,
  payTransaction,
  deleteTransaction,
  getUserTransactions
};