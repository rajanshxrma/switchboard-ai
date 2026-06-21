#!/bin/bash
set -e

echo "Creating Resource Group..."
az group create --name rg-enterprise-voice --location eastus

echo "Creating Azure Container Registry..."
az acr create --resource-group rg-enterprise-voice --name auroraaudioacrprod --sku Basic

echo "Logging into ACR..."
az acr login --name auroraaudioacrprod

echo "Building and Pushing Backend Image..."
cd /Users/rajansharma/Downloads/mobDev/enterprise-voice-ai/backend
docker build --platform linux/amd64 -t auroraaudioacrprod.azurecr.io/enterprise-voice-backend:latest .
docker push auroraaudioacrprod.azurecr.io/enterprise-voice-backend:latest

echo "Building and Pushing Frontend Image..."
cd /Users/rajansharma/Downloads/mobDev/enterprise-voice-ai/frontend
docker build --platform linux/amd64 -t auroraaudioacrprod.azurecr.io/enterprise-voice-frontend:latest .
docker push auroraaudioacrprod.azurecr.io/enterprise-voice-frontend:latest

echo "Phase 1 Complete."
