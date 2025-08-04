# Monitoring Setup Guide

This guide outlines the steps to complete the monitoring setup for the alexhopmann.com blog.

## Completed Implementation

1. **Rate Limiting** ✅
   - Created `/src/lib/server/rate-limit.ts` with configurable rate limiters
   - Applied to API endpoints (`/api/posts/*`)
   - Applied to authentication endpoints (`/auth/callback`)
   - Limits: 100 req/min for API, 20 req/min for writes, 10 req/min for auth

2. **Security Headers** ✅
   - Implemented in `/src/hooks.server.ts`
   - Content Security Policy (CSP)
   - HSTS (Strict Transport Security)
   - X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
   - Referrer Policy and Permissions Policy

3. **Application Insights Integration** ✅
   - Created `/src/lib/server/telemetry.ts` with telemetry client
   - Tracks page views, exceptions, events, and metrics
   - Integrated into hooks for automatic request tracking
   - Added tracking to post operations (create, update, delete)

4. **Monitoring Script** ✅
   - Created `/scripts/setup-azure-monitoring.sh`
   - Sets up Azure Monitor alerts for:
     - Container restarts/failures
     - High CPU usage (>80%)
     - High memory usage (>80%)
     - Front Door origin health
   - Creates Application Insights resource
   - Configures email and SMS alerts

## Deployment Steps

### 1. Create Application Insights Resource

Run the monitoring setup script:
```bash
cd /Users/alexhop/alexhopmann.com/alexhopmann-blog
./scripts/setup-azure-monitoring.sh
```

This will:
- Create Application Insights resource
- Set up Azure Monitor alerts
- Configure notification channels

### 2. Get Instrumentation Key

After running the script, get the instrumentation key:
```bash
az monitor app-insights component show \
  --app alexhopmann-blog-insights \
  --resource-group alexhopmann_blog \
  --query instrumentationKey -o tsv
```

### 3. Update Deployment Script

Edit `/scripts/deploy-via-acr-build.sh` and add the instrumentation key:
```bash
APPINSIGHTS_INSTRUMENTATIONKEY="your-key-here"
```

### 4. Deploy the Updates

Deploy all the new security and monitoring features:
```bash
./scripts/deploy-via-acr-build.sh
```

This will deploy:
- Rate limiting on all API endpoints
- Enhanced security headers
- Application Insights telemetry
- Error tracking and performance monitoring

## Verification

### Check Security Headers
```bash
curl -I https://www.alexhopmann.com
```

Look for:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: ...`
- `Strict-Transport-Security: ...`

### Test Rate Limiting
```bash
# Test API rate limiting (should block after 100 requests/minute)
for i in {1..110}; do
  curl https://www.alexhopmann.com/api/posts
done
```

### Monitor Application Insights

1. Go to Azure Portal
2. Navigate to the Application Insights resource
3. Check:
   - Live Metrics Stream
   - Failures
   - Performance
   - Usage

### Check Alerts

1. Go to Azure Monitor > Alerts
2. Verify alert rules are active
3. Test an alert by stopping/starting the container

## Optional: Create Availability Test

In Azure Portal:
1. Go to Application Insights > Availability
2. Create a URL ping test for https://www.alexhopmann.com
3. Set test frequency to 5 minutes
4. Select multiple test locations

## Maintenance

- Review Application Insights data weekly
- Check alert history monthly
- Update rate limits based on usage patterns
- Keep security headers up to date with best practices