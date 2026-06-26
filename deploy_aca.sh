#!/bin/bash
set -e

echo "Enabling Admin Access on ACR..."
az acr update -n auroraaudioacrprod --admin-enabled true

echo "Retrieving ACR Credentials..."
ACR_USERNAME=$(az acr credential show -n auroraaudioacrprod --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show -n auroraaudioacrprod --query "passwords[0].value" -o tsv)

echo "Registering Container Apps Provider (This can take a minute)..."
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait

echo "Creating Container Apps Environment..."
az containerapp env create \
  --name env-enterprise-voice \
  --resource-group rg-enterprise-voice \
  --location eastus

echo "Deploying Backend Container App..."
az containerapp create \
  --name ca-enterprise-backend \
  --resource-group rg-enterprise-voice \
  --environment env-enterprise-voice \
  --image auroraaudioacrprod.azurecr.io/enterprise-voice-backend:latest \
  --target-port 8000 \
  --ingress external \
  --registry-server auroraaudioacrprod.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD

echo "Deploying Frontend Container App..."
az containerapp create \
  --name ca-enterprise-frontend \
  --resource-group rg-enterprise-voice \
  --environment env-enterprise-voice \
  --image auroraaudioacrprod.azurecr.io/enterprise-voice-frontend:latest \
  --target-port 80 \
  --ingress external \
  --registry-server auroraaudioacrprod.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD

echo "ACA Serverless Deployment Complete."
BACKEND_FQDN=$(az containerapp show --name ca-enterprise-backend --resource-group rg-enterprise-voice --query "properties.configuration.ingress.fqdn" -o tsv)
FRONTEND_FQDN=$(az containerapp show --name ca-enterprise-frontend --resource-group rg-enterprise-voice --query "properties.configuration.ingress.fqdn" -o tsv)

echo "Backend URL: https://$BACKEND_FQDN"
echo "Frontend URL: https://$FRONTEND_FQDN"
