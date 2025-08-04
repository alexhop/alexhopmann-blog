#!/bin/bash

# Simple deployment script for alexhopmann-blog
# Requires Azure CLI to be logged in

echo "Starting deployment..."

# Build the Docker image using ACR
echo "Building image with Azure Container Registry..."
az acr build \
  --registry alexhopmannblogregistry \
  --image alexhopmannblog:latest \
  .

if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

# Update the Container App
echo "Updating Container App..."
az containerapp update \
  --name alexhopmann-blog-app \
  --resource-group alexhopmann_blog \
  --image alexhopmannblogregistry.azurecr.io/alexhopmannblog:latest

if [ $? -ne 0 ]; then
  echo "Container App update failed!"
  exit 1
fi

echo "Deployment complete!"
echo "Site will be available at https://www.alexhopmann.com in a few minutes"