const request = require('supertest');
const app = require('../src/app');

describe('Product Service API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('service', 'product-service');
    });
  });

  describe('GET /api/v1/products', () => {
    it('should return list of products', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .expect(200);
      
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Test',
        stock: 10
      };

      const res = await request(app)
        .post('/api/v1/products')
        .send(newProduct)
        .expect(201);
      
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', newProduct.name);
    });

    it('should fail with missing name', async () => {
      const invalidProduct = {
        price: 99.99
      };

      await request(app)
        .post('/api/v1/products')
        .send(invalidProduct)
        .expect(400);
    });
  });
});
