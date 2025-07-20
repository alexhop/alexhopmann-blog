#!/bin/bash

# Azure Setup Script for alexhopmann.com blog
# This script helps set up all the required Azure resources

echo "Azure Setup Script for alexhopmann.com"
echo "======================================"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Variables
RESOURCE_GROUP="alexhopmann-blog-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="alexhopmannblogstorage"
COSMOS_ACCOUNT="alexhopmann-blog-cosmos"
COSMOS_DATABASE="alexhopmann-blog"
STATIC_WEB_APP="alexhopmann-blog-swa"
B2C_TENANT="alexhopmannb2c"

echo "This script will create the following resources:"
echo "- Resource Group: $RESOURCE_GROUP"
echo "- Storage Account: $STORAGE_ACCOUNT"
echo "- Cosmos DB Account: $COSMOS_ACCOUNT"
echo "- Static Web App: $STATIC_WEB_APP"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Login to Azure
echo "Logging into Azure..."
az login

# Create Resource Group
echo "Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Storage Account
echo "Creating Storage Account..."
az storage account create \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot

# Get Storage Account Key
STORAGE_KEY=$(az storage account keys list \
    --resource-group $RESOURCE_GROUP \
    --account-name $STORAGE_ACCOUNT \
    --query '[0].value' \
    --output tsv)

# Create Blob Container
echo "Creating Blob Container..."
az storage container create \
    --name blog-media \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --public-access blob

# Create Cosmos DB Account
echo "Creating Cosmos DB Account..."
az cosmosdb create \
    --name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --kind GlobalDocumentDB \
    --locations regionName=$LOCATION failoverPriority=0 isZoneRedundant=False \
    --default-consistency-level Session \
    --enable-free-tier true

# Get Cosmos DB Key
COSMOS_KEY=$(az cosmosdb keys list \
    --name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query primaryMasterKey \
    --output tsv)

COSMOS_ENDPOINT=$(az cosmosdb show \
    --name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query documentEndpoint \
    --output tsv)

# Create Cosmos DB Database
echo "Creating Cosmos DB Database..."
az cosmosdb sql database create \
    --account-name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --name $COSMOS_DATABASE

# Create Cosmos DB Containers
echo "Creating Cosmos DB Containers..."

# Posts container
az cosmosdb sql container create \
    --account-name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --database-name $COSMOS_DATABASE \
    --name posts \
    --partition-key-path /slug \
    --throughput 400

# Comments container
az cosmosdb sql container create \
    --account-name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --database-name $COSMOS_DATABASE \
    --name comments \
    --partition-key-path /postId \
    --throughput 400

# Users container
az cosmosdb sql container create \
    --account-name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --database-name $COSMOS_DATABASE \
    --name users \
    --partition-key-path /email \
    --throughput 400

# Create Static Web App
echo "Creating Static Web App..."
az staticwebapp create \
    --name $STATIC_WEB_APP \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Free

# Get Static Web App deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP \
    --resource-group $RESOURCE_GROUP \
    --query properties.apiKey \
    --output tsv)

# Output configuration
echo ""
echo "======================================"
echo "Azure resources created successfully!"
echo "======================================"
echo ""
echo "Save these values in your .env file and GitHub Secrets:"
echo ""
echo "COSMOS_ENDPOINT=$COSMOS_ENDPOINT"
echo "COSMOS_KEY=$COSMOS_KEY"
echo "COSMOS_DATABASE=$COSMOS_DATABASE"
echo "COSMOS_CONTAINER_POSTS=posts"
echo "COSMOS_CONTAINER_COMMENTS=comments"
echo "COSMOS_CONTAINER_USERS=users"
echo "AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT"
echo "AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY"
echo "AZURE_STORAGE_CONTAINER_NAME=blog-media"
echo "AZURE_STATIC_WEB_APPS_API_TOKEN=$DEPLOYMENT_TOKEN"
echo ""
echo "For Azure AD B2C, you'll need to set up manually:"
echo "1. Create a B2C tenant"
echo "2. Register an application"
echo "3. Create a sign-up/sign-in user flow"
echo "4. Add the configuration to your .env file"
echo ""
echo "Custom domain setup:"
echo "1. Go to Azure Portal > Static Web Apps > $STATIC_WEB_APP"
echo "2. Click 'Custom domains' and add 'www.alexhopmann.com'"
echo "3. Follow the DNS configuration instructions"