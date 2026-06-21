#!/bin/bash
set -e

echo "Logging into ACR..."
az acr login --name auroraaudioacr123

echo "Building Backend for linux/amd64..."
cd /Users/rajansharma/Downloads/mobDev/enterprise-voice-ai/backend
docker build --platform linux/amd64 -t auroraaudioacr123.azurecr.io/enterprise-voice-backend:latest .
docker push auroraaudioacr123.azurecr.io/enterprise-voice-backend:latest

echo "Building Frontend for linux/amd64..."
cd /Users/rajansharma/Downloads/mobDev/enterprise-voice-ai/frontend
docker build --platform linux/amd64 -t auroraaudioacr123.azurecr.io/enterprise-voice-frontend:latest .
docker push auroraaudioacr123.azurecr.io/enterprise-voice-frontend:latest

echo "Images pushed successfully for amd64 architecture!"
