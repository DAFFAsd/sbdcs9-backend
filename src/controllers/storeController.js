const pool = require('../database/pg-database');

// get all stores
const getAllStores = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY created_at DESC');
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        payload: null,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Stores found',
      payload: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      payload: null,
    });
  }
};

// get store by ID
const getStoreById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        payload: null,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Store found',
      payload: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message:'Server Error',
      payload: null,
    });
  }
};

// create store
const createStore = async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({
      success: false,
      message: 'Missing store name or address',
      payload: null,
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO stores (name, address) VALUES ($1, $2) RETURNING *',
      [name, address]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        payload: null,
      });
    }
    res.status(201).json({
      success: true,
      message: 'Store created',
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
};

// delete store
const deleteStore = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM stores WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        payload: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store deleted',
      payload: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      payload: null,
    });
  }
};

// update store
const updateStore = async (req, res) => {
  const { id, name, address } = req.body;

  if (!name && !address) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name or address) must be provided',
      payload: null,
    });
  }

  try {
    const updatedStore = await pool.query(
      'UPDATE stores SET name = $2, address = $3 WHERE id = $1 RETURNING *',
      [id, name, address]
    );

    if (updatedStore.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        payload: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store updated',
      payload: updatedStore.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      payload: null,
    });
  }
};

module.exports = {
  getAllStores,
  getStoreById,
  createStore,
  deleteStore,
  updateStore
};