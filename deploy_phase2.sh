#!/bin/bash
set -e

echo "Creating AKS Cluster (This will take 3-5 minutes)..."
az aks create \
  --resource-group rg-enterprise-voice \
  --name aks-enterprise-voice \
  --location centralus \
  --node-count 1 \
  --generate-ssh-keys \
  --attach-acr auroraaudioacrprod \
  --enable-managed-identity

echo "Fetching AKS Credentials..."
az aks get-credentials --resource-group rg-enterprise-voice --name aks-enterprise-voice

echo "Applying Kubernetes Manifests..."
kubectl apply -f infrastructure/k8s/azure-aks-manifest.yaml

echo "Waiting for External IP Address..."
kubectl get services
