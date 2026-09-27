# Demo Setup Instructions - GitOps CI/CD Pipeline
## Module 2, Clip 3: Setting Up a GitHub Actions Pipeline for GitOps

## Overview
This demo focuses ONLY on building the GitOps CI/CD pipeline. Kubernetes deployment will be covered in Module 3.

## Prerequisites

### Required Software
- [ ] Git (v2.30+)
- [ ] Visual Studio Code
- [ ] Web browser

### Required Accounts
- [ ] GitHub account
- [ ] Docker Hub account (free tier)

## Part 1: Pre-Demo Setup (Before Recording)

### 1.1 Docker Hub Setup
1. Create account at https://hub.docker.com
2. Create a repository called `product-service` (public)
3. Generate access token:
   - Account Settings → Security → Access Tokens
   - New Access Token → Name: "github-actions"
   - Save credentials:
   ```
   DOCKER_USERNAME: your-dockerhub-username
   DOCKER_TOKEN: your-access-token
   ```

### 1.2 Create GitHub Repositories
Create two repositories on GitHub:
1. `microservices-shop` - Contains the application code
2. `k8s-config` - Will contain Kubernetes configurations

**Repository Structure Decision**: We're using separate repos (not monorepo) for clear separation of concerns

### 1.3 Set Up Application Repository
Clone and set up the application with pre-built code:

```bash
mkdir demo-workspace
cd demo-workspace
git clone https://github.com/YOUR_USERNAME/microservices-shop.git
cd microservices-shop
```

**Pre-built product-service/Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

**Pre-built product-service/src/index.js:**
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'product-service',
    version: process.env.VERSION || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/products', (req, res) => {
  res.json({
    products: [
      { id: 1, name: 'Laptop', price: 999 },
      { id: 2, name: 'Mouse', price: 25 }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});
```

**Pre-built product-service/package.json:**
```json
{
  "name": "product-service",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "echo 'Tests passed' && exit 0",
    "lint": "echo 'Linting passed' && exit 0"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

### 1.4 Initial Commit
```bash
git add .
git commit -m "Initial product service with Dockerfile"
git push origin main
```

### 1.5 Set Up Configuration Repository
```bash
cd ..
git clone https://github.com/YOUR_USERNAME/k8s-config.git
cd k8s-config

# Create basic structure for GitOps
mkdir -p environments/staging
mkdir -p environments/production

# Create placeholder files
echo "# Staging Environment" > environments/staging/README.md
echo "# Production Environment" > environments/production/README.md

git add .
git commit -m "Initial repository structure"
git push origin main
```

## Part 2: What We'll Build in the Demo

### Focus: GitOps CI/CD Pipeline Components

1. **GitHub Actions Workflow**
   - Build and test stages
   - Container building with Docker
   - Multi-environment tagging strategy
   - GitOps config updates

2. **Repository Structure**
   - Explain separation of app and config repos
   - Branching strategy for GitOps
   - Version tagging approach

3. **Security Configuration**
   - GitHub Secrets for Docker Hub
   - Personal Access Token for cross-repo updates
   - Secure credential management

4. **GitOps Automation**
   - Automated config repository updates
   - Environment-specific pipelines
   - Commit-based deployment triggers

## Part 3: Complete GitHub Actions Workflow (Reference)

This is what we'll build during the demo:

```yaml
name: GitOps CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    tags:
      - 'v*.*.*'
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run tests
        run: |
          cd product-service
          npm ci
          npm test
          npm run lint
      
      - name: Generate build metadata
        id: meta
        run: |
          SHA=${GITHUB_SHA::8}
          echo "sha=${SHA}" >> $GITHUB_OUTPUT
          
          if [[ $GITHUB_REF == refs/tags/v* ]]; then
            VERSION=${GITHUB_REF#refs/tags/}
            echo "version=${VERSION}" >> $GITHUB_OUTPUT
            echo "is_release=true" >> $GITHUB_OUTPUT
          else
            echo "is_release=false" >> $GITHUB_OUTPUT
          fi
          
          if [[ $GITHUB_REF == refs/heads/main ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [[ $GITHUB_REF == refs/heads/develop ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=none" >> $GITHUB_OUTPUT
          fi
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./product-service
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/product-service:${{ steps.meta.outputs.sha }}
            ${{ steps.meta.outputs.is_release == 'true' && format('{0}/product-service:{1}', secrets.DOCKER_USERNAME, steps.meta.outputs.version) || '' }}
            ${{ github.ref == 'refs/heads/main' && format('{0}/product-service:latest', secrets.DOCKER_USERNAME) || '' }}
            ${{ github.ref == 'refs/heads/develop' && format('{0}/product-service:develop', secrets.DOCKER_USERNAME) || '' }}
      
      - name: Update GitOps configuration
        if: steps.meta.outputs.environment != 'none'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          
          git clone https://${{ secrets.GITHUB_PAT }}@github.com/${{ github.repository_owner }}/k8s-config.git
          cd k8s-config
          
          ENV_PATH="environments/${{ steps.meta.outputs.environment }}"
          
          # Create/update version file for GitOps
          echo "product-service:${{ steps.meta.outputs.sha }}" > ${ENV_PATH}/product-service.version
          
          git add .
          git commit -m "Update product-service to ${{ steps.meta.outputs.sha }} in ${{ steps.meta.outputs.environment }}"
          git push
```

## Part 4: Demo Flow

### Scene 1: Repository Structure (1 min)
- Show why separate repos (separation of concerns)
- Explain branching strategy

### Scene 2: Build Basic Workflow (2 min)
- Create workflow file
- Add build and test steps
- Show GitHub Actions running

### Scene 3: Add Docker Integration (2 min)
- Configure Docker Hub secrets
- Add Docker build steps
- Implement tagging strategy

### Scene 4: GitOps Configuration Updates (2 min)
- Add GitHub PAT
- Implement config repo updates
- Show how changes trigger deployments

### Scene 5: Complete Pipeline Demo (1 min)
- Make a code change
- Show full pipeline execution
- Verify config repo update

## Part 5: Key Talking Points

### GitOps Principles
- Declarative: Everything in Git
- Versioned: Complete history
- Automated: No manual changes
- Auditable: Who changed what when

### Repository Strategy
- **Application repo**: Source code, Dockerfile, CI/CD
- **Config repo**: K8s manifests, environment configs
- **Separation benefits**: Different lifecycles, access controls

### Tagging Strategy
- SHA tags: Every commit, development tracking
- Semantic versions: Production releases
- Branch tags: Environment identification

### Security Best Practices
- No hardcoded secrets
- Minimal permission tokens
- Separate credentials per environment
- Audit trail in Git

## Part 6: Demo Commands

### Git Commands
```bash
# Create feature branch
git checkout -b feature/add-product

# Commit changes
git add .
git commit -m "feat: Add new product"

# Push to trigger pipeline
git push origin feature/add-product

# Create release tag
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

### GitHub CLI (Optional)
```bash
# Create PR
gh pr create --title "Add new product" --body "Adding keyboard"

# Check workflow runs
gh run list
gh run watch
```

## Part 7: VS Code Setup

### Workspace Configuration
```json
{
  "folders": [
    {
      "path": "microservices-shop",
      "name": "📦 Application"
    },
    {
      "path": "k8s-config",
      "name": "⚙️ Configuration"
    }
  ]
}
```

### Extensions to Have
- GitHub Actions
- YAML
- Docker

## Part 8: Browser Tabs

Have these ready:
1. GitHub - microservices-shop repo
2. GitHub - k8s-config repo
3. GitHub Actions tab
4. Docker Hub
5. GitHub Settings (for secrets)

## Part 9: Important Notes

### What NOT to Cover (Save for Module 3)
- ❌ Actual Kubernetes deployment
- ❌ kubectl commands
- ❌ Kubernetes manifests details
- ❌ Running containers locally
- ❌ Observability setup

### What TO Cover
- ✅ GitOps principles and benefits
- ✅ Repository structure decisions
- ✅ CI/CD pipeline construction
- ✅ Tagging and versioning strategy
- ✅ Automated configuration updates
- ✅ Security and secrets management

## Pre-Demo Checklist

- [ ] Both repos created and cloned
- [ ] Basic application code committed
- [ ] Docker Hub token ready
- [ ] Browser tabs open
- [ ] VS Code workspace ready
- [ ] No Kubernetes running (not needed for this module)
