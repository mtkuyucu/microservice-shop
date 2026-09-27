const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProduct, validateUpdateProduct, validateStockUpdate } = require('../middleware/validation');

// GET /api/v1/products - Get all products with filtering
router.get('/', productController.getAllProducts);

// GET /api/v1/products/categories - Get all categories
router.get('/categories', productController.getCategories);

// GET /api/v1/products/stats - Get product statistics
router.get('/stats', productController.getStats);

// GET /api/v1/products/:id - Get single product
router.get('/:id', productController.getProductById);

// POST /api/v1/products - Create new product
router.post('/', validateProduct, productController.createProduct);

// POST /api/v1/products/bulk - Bulk create products
router.post('/bulk', productController.bulkCreateProducts);

// PUT /api/v1/products/:id - Update product
router.put('/:id', validateUpdateProduct, productController.updateProduct);

// PATCH /api/v1/products/:id/stock - Update product stock
router.patch('/:id/stock', validateStockUpdate, productController.updateStock);

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;