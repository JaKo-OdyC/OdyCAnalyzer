# Deployment Guide

This guide covers deploying the OdyC Multi-Agent Documentation Analyzer to various platforms.

## 🚀 Replit Deployment (Recommended)

### Prerequisites
- Replit account
- OpenAI API key
- Anthropic API key (optional)

### Quick Deploy
1. **Fork/Import to Replit**
   ```bash
   # Import from GitHub URL in Replit
   https://github.com/yourusername/odyc-multi-agent-analyzer
   ```

2. **Configure Environment Variables**
   ```bash
   # In Replit Secrets tab
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   NODE_ENV=production
   ```

3. **Set up Database**
   ```bash
   # Replit will auto-configure DATABASE_URL
   # Run in Replit Shell
   npm run db:push
   ```

4. **Start Application**
   ```bash
   # Click Run button in Replit
   # Or use shell command
   npm run dev
   ```

### Replit Configuration
The project includes:
- `.replit` configuration for auto-setup
- `replit.nix` for environment dependencies
- Automatic port detection and database provisioning

## 🐳 Docker Deployment

### Prerequisites
- Docker and Docker Compose
- PostgreSQL database
- AI API keys

### Docker Setup
1. **Create Docker Configuration**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy source code
   COPY . .
   
   # Build application
   RUN npm run build
   
   # Expose port
   EXPOSE 5000
   
   # Start application
   CMD ["npm", "start"]
   ```

2. **Docker Compose Configuration**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://postgres:password@db:5432/odyc_analyzer
         - OPENAI_API_KEY=${OPENAI_API_KEY}
         - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
       depends_on:
         - db
       volumes:
         - uploads:/app/uploads
   
     db:
       image: postgres:15-alpine
       environment:
         - POSTGRES_DB=odyc_analyzer
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
   
   volumes:
     postgres_data:
     uploads:
   ```

3. **Deploy with Docker Compose**
   ```bash
   # Set environment variables
   export OPENAI_API_KEY=your_openai_api_key
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   
   # Start services
   docker-compose up -d
   
   # Run database migrations
   docker-compose exec app npm run db:push
   ```

## ☁️ Cloud Platform Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       },
       {
         "src": "client/src/**",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/client/dist/$1"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   # Set environment variables in Vercel dashboard
   # Then deploy
   vercel --prod
   ```

### Railway Deployment

1. **Create railway.json**
   ```json
   {
     "version": 2,
     "build": {
       "command": "npm run build"
     },
     "start": {
       "command": "npm start"
     }
   }
   ```

2. **Deploy via CLI**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

### Heroku Deployment

1. **Create Procfile**
   ```
   web: npm start
   ```

2. **Deploy**
   ```bash
   # Install Heroku CLI and login
   heroku create your-app-name
   
   # Set environment variables
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set ANTHROPIC_API_KEY=your_key
   heroku config:set NODE_ENV=production
   
   # Add PostgreSQL addon
   heroku addons:create heroku-postgresql:mini
   
   # Deploy
   git push heroku main
   
   # Run migrations
   heroku run npm run db:push
   ```

## 🔧 Production Configuration

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/database
OPENAI_API_KEY=sk-...
NODE_ENV=production

# Optional
ANTHROPIC_API_KEY=sk-ant-...
PORT=5000
LOG_LEVEL=info

# Database connection (if not using DATABASE_URL)
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=odyc_analyzer
```

### Database Setup
```sql
-- Create database
CREATE DATABASE odyc_analyzer;

-- Create user (optional)
CREATE USER odyc_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE odyc_analyzer TO odyc_user;
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_chat_messages_file_id ON chat_messages(file_id);
CREATE INDEX idx_analysis_runs_status ON analysis_runs(status);
CREATE INDEX idx_agent_logs_analysis_run_id ON agent_logs(analysis_run_id);
```

#### Application Optimization
```javascript
// Enable gzip compression
app.use(compression());

// Set up connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Security Configuration

#### HTTPS/SSL
```bash
# Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

#### CORS Configuration
```javascript
// Configure CORS for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-domain.com',
  credentials: true,
  optionsSuccessStatus: 200
}));
```

## 📊 Monitoring and Logging

### Application Monitoring
```javascript
// Add request logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Database Monitoring
```sql
-- Monitor database performance
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_database;
```

### Error Tracking
Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for user session recording
- **DataDog** for infrastructure monitoring
- **New Relic** for application performance

## 🔄 Backup and Recovery

### Database Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
rm backup_$DATE.sql
```

### File Backups
```bash
# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
aws s3 cp uploads_backup_*.tar.gz s3://your-backup-bucket/uploads/
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to production
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
pg_isready -h $PGHOST -p $PGPORT -U $PGUSER

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Memory Issues
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 dist/index.js
```

#### Port Issues
```bash
# Check if port is in use
lsof -i :5000
netstat -tulpn | grep :5000
```

### Logs and Debugging
```bash
# View application logs
tail -f logs/app.log

# Debug mode
NODE_ENV=development DEBUG=* npm start
```

## 📞 Support

For deployment issues:
- Check the [GitHub Issues](https://github.com/yourusername/odyc-multi-agent-analyzer/issues)
- Review the [Documentation](https://github.com/yourusername/odyc-multi-agent-analyzer/wiki)
- Contact support via the repository discussions

Remember to always test deployments in a staging environment before production! 🎯