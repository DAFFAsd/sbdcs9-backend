const pool = require('../database/pg-database');
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const registerUser = async (req, res) => {
  const { name, email, password, balance } = req.body;
  function validateEmail(email) { 
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;  
    return regex.test(email); 
  } 
  function validatePassword(password) { 
    const regex = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/; 
    return regex.test(password); 
  }
  try {
    if(!validateEmail(email)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email',
        payload: null,
      });
    }
    if(!validatePassword(password)) {
      return res.status(404).json({
        success: false,
        message: 'password must be at least 8 characters long and contain at least one number and one special character',
        payload: null,
      });
    }
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if(balance == null){
        const result = await pool.query(
          'INSERT INTO users (name, email, password, balance) VALUES ($1, $2, $3, 0) RETURNING *',
          [name, email, hash]
        );
        if(result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Email already used',
            payload: null,
          });
        }
        res.status(201).json({
          success: true,
          message: 'User created',
          payload: result.rows[0],
        });
      }
      else {
        const result = await pool.query(
          'INSERT INTO users (name, email, password, balance) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, email, hash, balance]
        );
        if(result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Email already used',
            payload: null,
          });
        }
        res.status(201).json({
          success: true,
          message: 'User created',
          payload: result.rows[0],
        });
      }
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

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if(result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or password',
        payload: null,
      });
    }
    bcrypt.compare(password, result.rows[0].password, function(err, hasil) {
      if(!hasil) {
        return res.status(404).json({
          success: false,
          message: 'Invalid email or password',
          payload: null,
        });
      }
      else {
        res.status(201).json({
          success: true,
          message: 'Login success',
          payload: result.rows[0],
        });
      }
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

const getUserByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if(result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        payload: null,
      });
    }
    res.status(200).json({
      success: true,
      message: 'User found',
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

const updateUser = async (req, res) => {
  const { id, email, password, name } = req.body;
  function validateEmail(email) { 
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;  
    return regex.test(email); 
  } 
  function validatePassword(password) { 
    const regex = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/; 
    return regex.test(password); 
  }
  try {
    if(!validateEmail(email)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email',
        payload: null,
      });
    }
    if(!validatePassword(password)) {
      return res.status(404).json({
        success: false,
        message: 'password must be at least 8 characters long and contain at least one number and one special character',
        payload: null,
      });
    }
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      const updatedUser = await pool.query(
        'UPDATE users SET name = $1, password = $2, email = $3 WHERE id = $4 RETURNING *',
        [name, hash, email, id]
      );
      if(updatedUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          payload: null,
        });
      }
      res.status(200).json({
        success: true,
        message: 'User updated',
        payload: updatedUser.rows[0],
      });
    }
  );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      payload: null,
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        payload: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted',
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

const topUp = async (req, res) => {
  const { email, amount } = req.body;

  try {
    if(amount <= 0) {
      return res.status(404).json({
        success: false,
        message: 'Amount must be larger than 0',
        payload: null,
      });
    }
    
    // Get user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        payload: null,
      });
    }
    
    const userId = userResult.rows[0].id;
    
    // Update balance
    const result = await pool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING *',
      [amount, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Top up successful',
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

module.exports = {
  registerUser,
  loginUser,
  getUserByEmail,
  updateUser,
  deleteUser,
  topUp
};