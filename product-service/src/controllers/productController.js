const { productStore } = require('../models/product');

class ProductController {
  // Get all products with filtering and pagination
  async getAllProducts(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = productStore.findAll(filters);
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product by ID
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = productStore.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: `No product found with ID: ${id}`
        });
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new product
  async createProduct(req, res, next) {
    try {
      const productData = req.body;
      
      // Validate required fields
      if (!productData.name) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Product name is required'
        });
      }

      if (productData.price !== undefined && productData.price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Product price cannot be negative'
        });
      }

      const product = productStore.create(productData);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('cannot be')) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
      }
      next(error);
    }
  }

  // Update product
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Don't allow ID updates
      delete updateData.id;
      delete updateData.createdAt;

      if (updateData.price !== undefined && updateData.price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Product price cannot be negative'
        });
      }

      const product = productStore.update(id, updateData);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: `No product found with ID: ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('cannot be')) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
      }
      next(error);
    }
  }

  // Delete product
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = productStore.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: `No product found with ID: ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product categories
  async getCategories(req, res, next) {
    try {
      const categories = productStore.getCategories();
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product statistics
  async getStats(req, res, next) {
    try {
      const stats = productStore.getStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk create products
  async bulkCreateProducts(req, res, next) {
    try {
      const { products } = req.body;

      if (!Array.isArray(products)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Products must be an array'
        });
      }

      const createdProducts = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        try {
          const product = productStore.create(products[i]);
          createdProducts.push(product);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }

      if (errors.length > 0) {
        return res.status(207).json({
          success: false,
          message: 'Some products could not be created',
          data: createdProducts,
          errors
        });
      }

      res.status(201).json({
        success: true,
        message: `${createdProducts.length} products created successfully`,
        data: createdProducts
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product stock
  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;

      if (!quantity || typeof quantity !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Quantity must be a number'
        });
      }

      const product = productStore.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: `No product found with ID: ${id}`
        });
      }

      let newStock;
      if (operation === 'add') {
        newStock = product.stock + quantity;
      } else if (operation === 'subtract') {
        newStock = product.stock - quantity;
        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient Stock',
            message: `Cannot reduce stock below 0. Current stock: ${product.stock}`
          });
        }
      } else if (operation === 'set') {
        newStock = quantity;
        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Stock cannot be negative'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Operation must be one of: add, subtract, set'
        });
      }

      const updatedProduct = productStore.update(id, { stock: newStock });
      
      res.status(200).json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          previousStock: product.stock,
          newStock: updatedProduct.stock,
          operation,
          quantity
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();