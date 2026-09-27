const { body, validationResult } = require('express-validator');

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Product creation validation
const validateProduct = [
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Product name must be less than 200 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('category')
    .optional()
    .isString().withMessage('Category must be a string'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('sku')
    .optional()
    .isString().withMessage('SKU must be a string'),
  body('imageUrl')
    .optional()
    .isURL().withMessage('Image URL must be a valid URL'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean'),
  handleValidationErrors
];

// Product update validation
const validateUpdateProduct = [
  body('name')
    .optional()
    .notEmpty().withMessage('Product name cannot be empty')
    .isLength({ max: 200 }).withMessage('Product name must be less than 200 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('category')
    .optional()
    .isString().withMessage('Category must be a string'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('sku')
    .optional()
    .isString().withMessage('SKU must be a string'),
  body('imageUrl')
    .optional()
    .isURL().withMessage('Image URL must be a valid URL'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean'),
  handleValidationErrors
];

// Stock update validation
const validateStockUpdate = [
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt().withMessage('Quantity must be an integer'),
  body('operation')
    .notEmpty().withMessage('Operation is required')
    .isIn(['add', 'subtract', 'set']).withMessage('Operation must be one of: add, subtract, set'),
  handleValidationErrors
];

module.exports = {
  validateProduct,
  validateUpdateProduct,
  validateStockUpdate
};