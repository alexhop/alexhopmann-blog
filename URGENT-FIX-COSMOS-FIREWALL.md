# URGENT: Fix Cosmos DB Firewall

The blog cannot edit/delete posts because the container is blocked by Cosmos DB firewall.

## Quick Fix Command

Wait for the current Cosmos DB operation to complete (check with the status command below), then run ONE of these options:

### Check Status First:
```bash
az cosmosdb show --name alexhopmannblog --resource-group alexhopmann_blog --query provisioningState -o tsv
```
(Should show "Succeeded" before proceeding)

### Option 1: Add Container IP (Quick but temporary)
```bash
az cosmosdb update \
  --name alexhopmannblog \
  --resource-group alexhopmann_blog \
  --ip-range-filter "71.212.128.90,172.182.186.42,0.0.0.0,4.236.4.106"
```

### Option 2: Allow Azure Services (RECOMMENDED)
```bash
# This adds 0.0.0.0/0 which allows all Azure services
az cosmosdb update \
  --name alexhopmannblog \
  --resource-group alexhopmann_blog \
  --ip-range-filter "71.212.128.90,172.182.186.42,0.0.0.0,0.0.0.0/0"
```

After running either command (takes 5-10 minutes), the edit/delete functionality will work.

## Why This Happened
- Container IP: 4.236.4.106
- Allowed IPs: 71.212.128.90, 172.182.186.42, 0.0.0.0
- The container IP is NOT in the allowed list
- All database write operations are blocked by the firewall