# Product Service

A RESTful microservice for managing products in the demo microservice shop application.

## Features

- Full CRUD operations for products
- Swagger UI documentation at `/api-docs`
- Health check endpoint
- Product filtering, searching, and pagination
- Stock management
- Bulk operations
- Docker support

## API Documentation

Once running, visit http://localhost:3000/api-docs for interactive API documentation.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run locally
npm start

# Run with nodemon (auto-reload)
npm run dev
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t product-service .
docker run -p 3000:3000 product-service
```

## API Endpoints

- `GET /health` - Service health check
- `GET /api/v1/products` - List all products (with pagination & filters)
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product
- `PATCH /api/v1/products/:id/stock` - Update product stock
- `GET /api/v1/products/categories` - List all categories
- `GET /api/v1/products/stats` - Get product statistics
- `POST /api/v1/products/bulk` - Bulk create products

## Testing

```bash
npm test
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `VERSION` - Service version

## Docker Hub

This service is automatically built and pushed to Docker Hub via GitHub Actions:
- Latest: `<username>/product-service:latest`
- Develop: `<username>/product-service:develop`
- Tagged releases: `<username>/product-service:v1.0.0`