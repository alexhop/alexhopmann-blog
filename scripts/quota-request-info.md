# Azure App Service Quota Request Instructions

## Current Situation
Your Azure subscription (VSEntSub) has a quota limit of 0 for all App Service tiers (Free, Basic, Standard) in all regions. This prevents creating any App Service Plans.

## Steps to Request Quota Increase

1. **Go to Azure Support**: 
   - Direct link: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade/newsupportrequest
   
2. **Fill out the support request**:
   - **Issue type**: Service and subscription limits (quotas)
   - **Subscription**: VSEntSub (21caf7c2-98c9-4f28-92b1-c7ec81e62135)
   - **Quota type**: App Service
   - **Details**: Click "Provide details" and fill in:
     - **Region**: West US 2
     - **Deployment Model**: Resource Manager
     - **Type**: Basic (B1) 
     - **New Limit**: 1 (or more if you anticipate growth)
   
3. **Add justification**:
   - "Need to deploy a Node.js blog application with server-side rendering capabilities. Currently using Static Web Apps but need full App Service for dynamic features including authentication, content management, and API endpoints."

4. **Contact information**:
   - Use your Microsoft email and contact details
   - Severity: Moderate (business impact)

## Alternative: Try Different Regions
If quota approval takes time, you could try deploying to a different region where you might have quota available:
- East US
- West US
- Central US

## Temporary Workaround
While waiting for quota approval, your blog is currently running as a static site at:
- https://kind-dune-00cb5791e.2.azurestaticapps.net

## After Quota Approval
Once your quota request is approved, run:
```bash
./scripts/deploy-as-nodejs-app.sh
```

This script will:
1. Create an App Service Plan (B1 tier)
2. Create a Web App for Node.js
3. Configure deployment settings
4. Deploy your SvelteKit application
5. Set up custom domain (www.alexhopmann.com)