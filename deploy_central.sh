#!/bin/bash
set -e

echo "Creating new Resource Group in Central US..."
az group create --name rg-enterprise-voice-central --location centralus

echo "Creating AKS Cluster in Central US..."
az aks create \
  --resource-group rg-enterprise-voice-central \
  --name aks-enterprise-voice-central \
  --location centralus \
  --node-count 1 \
  --node-vm-size Standard_B2s \
  --generate-ssh-keys \
  --attach-acr auroraaudioacr123 \
  --enable-managed-identity

echo "Fetching AKS Credentials..."
az aks get-credentials --resource-group rg-enterprise-voice-central --name aks-enterprise-voice-central

echo "Applying Kubernetes Manifests..."
kubectl apply -f infrastructure/k8s/azure-aks-manifest.yaml

echo "Waiting for External IP Address..."
kubectl get services
