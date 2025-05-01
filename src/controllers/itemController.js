const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs');
const pool = require('../database/pg-database');

const checkStoreExists = async (storeId) => {
  const result = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
  return result.rows.length > 0;
};

exports.createItem = async (req, res) => {
  try {
    const { name, price, store_id, stock } = req.body;
    
    const storeExists = await checkStoreExists(store_id);
    if (!storeExists) {
      return res.status(404).json({
        succes: false,
        message: "Store doesnt exist",
        payload: null
      });
    }

    let image_url = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'items',
      });
      
      image_url = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const queryResult = await pool.query(
      'INSERT INTO items (name, price, store_id, image_url, stock, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, parseInt(price), store_id, image_url, parseInt(stock), new Date()]
    );
    return res.status(201).json({
      succes: true,
      message: "Item created",
      payload: queryResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return res.status(500).json({
      succes: false,
      message: "Server error",
      payload: null
    });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    return res.status(200).json({
      succes: true, 
      message: "Items found",
      payload: result.rows
    });
  } catch (error) {
    console.error('Error getting items:', error);
    return res.status(500).json({
      succes: false,
      message: "Server error",
      payload: null
    });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        succes: false,
        message: "Item not found",
        payload: null
      });
    }
    
    return res.status(200).json({
      succes: true,
      message: "Item found",
      payload: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting item:', error);
    return res.status(500).json({
      succes: false,
      message: "Server error",
      payload: null
    });
  }
};

exports.getItemByStoreId = async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM items WHERE store_id = $1', [req.params.store_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          succes: false,
          message: "Store doesnt exist",
          payload: null
        });
      }
      
      return res.status(200).json({
        succes: true,
        message: "Items found",
        payload: result.rows
      });
    } catch (error) {
      console.error('Error getting item:', error);
      return res.status(500).json({
        succes: false,
        message: "Server error",
        payload: null
      });
    }
  };
  

exports.updateItem = async (req, res) => {
    try {
      const { id, name, price, store_id, stock } = req.body;
      const itemExists = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
      if (itemExists.rows.length === 0) {
        return res.status(404).json({
          succes: false,
          message: "Item not found",
          payload: null
        });
      }
      if (store_id) {
        const storeExists = await checkStoreExists(store_id);
        if (!storeExists) {
          return res.status(404).json({
            succes: false,
            message: "Store doesnt exist",
            payload: null
          });
        }
      }
  
      let image_url = itemExists.rows[0].image_url;
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'items',
        });
        
        image_url = result.secure_url;
        fs.unlinkSync(req.file.path);
      }

      const queryResult = await pool.query(
        'UPDATE items SET name = COALESCE($1, name), price = COALESCE($2, price), store_id = COALESCE($3, store_id), image_url = COALESCE($4, image_url), stock = COALESCE($5, stock) WHERE id = $6 RETURNING *',
        [name, price ? parseInt(price) : null, store_id, image_url, stock ? parseInt(stock) : null, id]
      );
      
      return res.status(200).json({
        succes: true,
        message: "Item updated",
        payload: queryResult.rows[0]
      });
    } catch (error) {
      console.error('Error updating item:', error);
      return res.status(500).json({
        succes: false,
        message: "Server error",
        payload: null
      });
    }
  };

  exports.deleteItem = async (req, res) => {
    try {
      const { id } = req.params;
      const itemExists = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
      if (itemExists.rows.length === 0) {
        return res.status(404).json({
          succes: false,
          message: "Item not found",
          payload: null
        });
      }
      await pool.query('DELETE FROM items WHERE id = $1', [id]);
      
      return res.status(200).json({
        succes: true,
        message: "Item deleted",
        payload: itemExists.rows
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      return res.status(500).json({
        succes: false,
        message: "Server error",
        payload: null
      });
    }
  };