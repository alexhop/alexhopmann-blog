# DNS Configuration for www.alexhopmann.com

## Current Infrastructure Status (Updated: August 3, 2025)

### ✅ DNS Configuration Complete
- **Domain**: www.alexhopmann.com and alexhopmann.com
- **DNS Provider**: GoDaddy
- **CNAME Record**: www → alexhopmann-blog-ega6amahfmadgvcw.z03.azurefd.net
- **SSL Certificate**: Auto-provisioned by Azure Front Door (managed)

### ✅ Azure Front Door Configuration
- **Profile**: alexhopmann-blog-frontdoor
- **Endpoint**: alexhopmann-blog-ega6amahfmadgvcw.z03.azurefd.net
- **Custom Domains**: 
  - www.alexhopmann.com (active)
  - alexhopmann.com (configured)
- **Origin Group**: container-origin-group
- **Origin**: Points to Container Instance IP (20.14.9.71:3000)
- **Forwarding Protocol**: HTTP-only (container doesn't support HTTPS)
- **HTTPS Redirect**: Enabled on Front Door
- **Cache**: Configured with purge capability

### ✅ Azure Container Instance
- **Name**: alexhopmann-blog
- **Current IP**: 20.14.9.71 (changes on container recreation)
- **DNS Name**: alexhopmann-blog.westus3.azurecontainer.io
- **Port**: 3000
- **Image**: alexhopmannblogregistry.azurecr.io/alexhopmannblog:latest
- **Build Version**: 2025-08-03.2-debug-fix
- **Status**: Running

### ✅ Authentication Configuration
- **Azure AD App**: alexhopmann-blog (de641345-595d-44de-8d0a-9b54330b7cad)
- **Tenant**: Microsoft (72f988bf-86f1-41af-91ab-2d7cd011db47)
- **Client Secret**: Configured (expires in 2 years)
- **Authorized Users**: alex@hopmann.org
- **JWT**: Configured for session management

### ✅ Azure Cosmos DB
- **Account**: alexhopmannblog
- **Database**: alexhopmann-blog
- **Containers**: posts, comments, users
- **Firewall**: Configured with Azure services bypass enabled
- **Network ACL**: Allows container access

### ✅ Azure Storage
- **Account**: alexhopmannblogstorage
- **Container**: media (for blog images/uploads)
- **Access**: Configured via storage key

### ✅ Features Deployed
- Admin dashboard with debug footer showing build version
- Post management (create, edit, delete)
- Media upload functionality
- Comment system (ready but not activated)
- Rate limiting on API endpoints
- Security headers (CSP, HSTS)
- Enhanced error reporting with debug components
- Version endpoint at /api/version

### Access URLs:
- **Production**: https://www.alexhopmann.com
- **Front Door Endpoint**: https://alexhopmann-blog-ega6amahfmadgvcw.z03.azurefd.net
- **Container Direct** (IP changes): http://20.14.9.71:3000
- **Container DNS**: http://alexhopmann-blog.westus3.azurecontainer.io:3000

### Deployment Commands:
```bash
# Deploy new version via ACR
./scripts/deploy-via-acr-build.sh

# Update Front Door origin after container IP change
az afd origin update --origin-group-name container-origin-group \
  --origin-name container-origin \
  --profile-name alexhopmann-blog-frontdoor \
  --resource-group alexhopmann_blog \
  --host-name <NEW_IP> \
  --http-port 3000

# Purge Front Door cache
az afd endpoint purge --endpoint-name alexhopmann-blog \
  --profile-name alexhopmann-blog-frontdoor \
  --resource-group alexhopmann_blog \
  --content-paths "/*"
```

### Known Issues:
- Container IP changes on recreation requiring Front Door origin update
- Front Door propagation takes 5-10 minutes after configuration changes
- Container doesn't support HTTPS (handled by Front Door)