const { v4: uuidv4 } = require('uuid');

class Product {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description || '';
    this.price = parseFloat(data.price) || 0;
    this.category = data.category || 'general';
    this.stock = parseInt(data.stock) || 0;
    this.sku = data.sku || `SKU-${this.id.substring(0, 8).toUpperCase()}`;
    this.imageUrl = data.imageUrl || null;
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (this.name && this.name.length > 200) {
      errors.push('Product name must be less than 200 characters');
    }

    if (this.price < 0) {
      errors.push('Product price cannot be negative');
    }

    if (this.stock < 0) {
      errors.push('Product stock cannot be negative');
    }

    if (this.description && this.description.length > 1000) {
      errors.push('Product description must be less than 1000 characters');
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      stock: this.stock,
      sku: this.sku,
      imageUrl: this.imageUrl,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// In-memory data store for demo purposes
class ProductStore {
  constructor() {
    this.products = new Map();
    this.initializeSampleData();
  }

  initializeSampleData() {
    const sampleProducts = [
      {
        name: 'Laptop',
        description: 'High-performance business laptop with 16GB RAM and 512GB SSD',
        price: 999.99,
        category: 'Electronics',
        stock: 50,
        imageUrl: 'https://via.placeholder.com/300x200?text=Laptop'
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 24.99,
        category: 'Accessories',
        stock: 150,
        imageUrl: 'https://via.placeholder.com/300x200?text=Mouse'
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with Cherry MX switches',
        price: 149.99,
        category: 'Accessories',
        stock: 75,
        imageUrl: 'https://via.placeholder.com/300x200?text=Keyboard'
      },
      {
        name: 'USB-C Hub',
        description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader',
        price: 49.99,
        category: 'Accessories',
        stock: 100,
        imageUrl: 'https://via.placeholder.com/300x200?text=USB+Hub'
      },
      {
        name: 'Monitor Stand',
        description: 'Adjustable monitor stand with cable management',
        price: 34.99,
        category: 'Office',
        stock: 60,
        imageUrl: 'https://via.placeholder.com/300x200?text=Monitor+Stand'
      }
    ];

    sampleProducts.forEach(productData => {
      const product = new Product(productData);
      this.products.set(product.id, product);
    });
  }

  findAll(filters = {}) {
    let products = Array.from(this.products.values());

    if (filters.category) {
      products = products.filter(p => 
        p.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.active !== undefined) {
      products = products.filter(p => p.active === filters.active);
    }

    if (filters.minPrice !== undefined) {
      products = products.filter(p => p.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice !== undefined) {
      products = products.filter(p => p.price <= parseFloat(filters.maxPrice));
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    if (filters.sortBy) {
      products.sort((a, b) => {
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        
        switch(filters.sortBy) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'price':
          return order * (a.price - b.price);
        case 'createdAt':
          return order * (new Date(a.createdAt) - new Date(b.createdAt));
        default:
          return 0;
        }
      });
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      data: paginatedProducts.map(p => p.toJSON()),
      pagination: {
        total: products.length,
        page,
        limit,
        pages: Math.ceil(products.length / limit)
      }
    };
  }

  findById(id) {
    const product = this.products.get(id);
    return product ? product.toJSON() : null;
  }

  create(productData) {
    const product = new Product(productData);
    const errors = product.validate();

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    this.products.set(product.id, product);
    return product.toJSON();
  }

  update(id, updateData) {
    const existingProduct = this.products.get(id);
    
    if (!existingProduct) {
      return null;
    }

    const updatedProductData = {
      ...existingProduct.toJSON(),
      ...updateData,
      id: existingProduct.id,
      createdAt: existingProduct.createdAt,
      updatedAt: new Date().toISOString()
    };

    const updatedProduct = new Product(updatedProductData);
    const errors = updatedProduct.validate();

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    this.products.set(id, updatedProduct);
    return updatedProduct.toJSON();
  }

  delete(id) {
    const product = this.products.get(id);
    
    if (!product) {
      return false;
    }

    this.products.delete(id);
    return true;
  }

  getCategories() {
    const categories = new Set();
    this.products.forEach(product => {
      categories.add(product.category);
    });
    return Array.from(categories).sort();
  }

  getStats() {
    const products = Array.from(this.products.values());
    
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.active).length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      categories: this.getCategories().length,
      averagePrice: products.length > 0 
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
        : 0
    };
  }
}

// Create singleton instance
const productStore = new ProductStore();

module.exports = { Product, productStore };