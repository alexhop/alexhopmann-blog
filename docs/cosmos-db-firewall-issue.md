# Cosmos DB Firewall Issue

## Problem
The blog application cannot edit or delete posts because the Azure Container Instance is blocked by the Cosmos DB firewall.

### Symptoms
- All read operations work fine
- Edit/delete operations fail with firewall errors
- Error: "Request originated from IP X.X.X.X through public internet. This is blocked by your Cosmos DB account firewall settings"

### Root Cause
The Container Instance IP (4.236.4.106) is not in the Cosmos DB firewall allow list.

## Solutions

### Immediate Fix (Option 1)
Add the container IP to the firewall:
```bash
# Wait for current operation to complete, then run:
az cosmosdb update \
  --name alexhopmannblog \
  --resource-group alexhopmann_blog \
  --ip-range-filter "71.212.128.90,172.182.186.42,0.0.0.0,4.236.4.106"
```

**Note**: This IP may change when the container restarts, requiring updates.

### Recommended Fix (Option 2)
Allow all Azure services to access Cosmos DB:
```bash
az cosmosdb update \
  --name alexhopmannblog \
  --resource-group alexhopmann_blog \
  --enable-virtual-network false \
  --enable-public-network true \
  --ip-range-filter "71.212.128.90,172.182.186.42,0.0.0.0,0.0.0.0/0"
```

**Note**: Adding `0.0.0.0/0` to the IP filter allows all Azure services while still maintaining the firewall for external access.

### Best Practice (Option 3)
Use Managed Identity:
1. Enable system-assigned managed identity on the container
2. Grant Cosmos DB access to the managed identity
3. Update application code to use managed identity instead of keys

This requires code changes but provides the best security.

## Verification
After applying the fix, test with:
```bash
curl https://www.alexhopmann.com/api/posts
```

Then try editing/deleting a post in the admin interface.

## Prevention
To prevent this in the future:
1. Use Option 2 or 3 above
2. Document the firewall configuration in deployment scripts
3. Monitor for container IP changes
4. Consider using a VNet with private endpoints for production