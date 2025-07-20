# Deployment Guide for alexhopmann.com

This guide walks you through deploying the blog to Azure Static Web Apps.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed
- GitHub account
- Node.js 18+ installed

## Step 1: Set up Azure Resources

Run the setup script to create all required Azure resources:

```bash
./scripts/setup-azure.sh
```

This will create:
- Resource Group
- Storage Account for media files
- Cosmos DB account with required containers
- Static Web App

Save the output values - you'll need them for configuration.

## Step 2: Set up Azure AD B2C

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new Azure AD B2C tenant
3. Register a new application:
   - Name: `alexhopmann-blog`
   - Redirect URI: `https://www.alexhopmann.com/auth/callback`
   - Enable ID tokens
4. Create a sign-up/sign-in user flow
5. Note down:
   - Tenant name
   - Application (client) ID
   - Client secret (create one in Certificates & secrets)

## Step 3: Configure Environment

1. Copy `.env.example` to `.env`
2. Fill in all values from the setup script output
3. Add Azure AD B2C configuration
4. Generate a secure JWT_SECRET

## Step 4: Set up GitHub Repository

1. Create a new GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## Step 5: Configure GitHub Secrets

In your GitHub repository, go to Settings > Secrets and add:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE`
- `COSMOS_CONTAINER_POSTS`
- `COSMOS_CONTAINER_COMMENTS`
- `COSMOS_CONTAINER_USERS`
- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_ACCOUNT_KEY`
- `AZURE_STORAGE_CONTAINER_NAME`
- `AZURE_AD_B2C_TENANT_NAME`
- `AZURE_AD_B2C_CLIENT_ID`
- `AZURE_AD_B2C_CLIENT_SECRET`
- `AZURE_AD_B2C_POLICY_NAME`
- `JWT_SECRET`

## Step 6: Deploy

Push to main branch to trigger deployment:

```bash
git push origin main
```

The GitHub Action will automatically build and deploy your site.

## Step 7: Configure Custom Domain

1. Go to Azure Portal > Static Web Apps > Your App
2. Click "Custom domains"
3. Add `www.alexhopmann.com`
4. Update your DNS records as instructed
5. Wait for SSL certificate provisioning

## Step 8: Migrate Content

After deployment, run the migration scripts:

1. For legacy HTML content:
   ```bash
   npm run migrate:content
   ```

2. For WordPress content (if you have database access):
   ```bash
   npm run migrate:wordpress
   ```

## Step 9: Create Admin User

1. Navigate to `https://www.alexhopmann.com/auth/login`
2. Sign up with your Microsoft account
3. The first user will need to be manually given admin role in Cosmos DB

## Monitoring

- Check deployment status in GitHub Actions
- Monitor application in Azure Portal > Static Web Apps
- View logs in Application Insights (if configured)

## Troubleshooting

### Build Failures
- Check GitHub Actions logs
- Verify all environment variables are set
- Ensure Node.js version matches

### Authentication Issues
- Verify Azure AD B2C configuration
- Check redirect URIs match
- Ensure client secret is valid

### Database Connection
- Verify Cosmos DB firewall rules
- Check connection string format
- Ensure containers exist

### Media Upload
- Verify Storage Account access
- Check CORS settings if needed
- Ensure container has public blob access