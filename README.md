# DEPLOY-NODEJS-WITH-GITHUB-PIPELINE-TO-KUBERNATES
This project demonstrates how to deploy a Node.js application to Azure Kubernetes Service (AKS) using a GitHub Actions pipeline for continuous integration and continuous deployment (CI/CD). The application is containerized using Docker, stored in Azure Container Registry (ACR), and deployed to an AKS cluster. This README provides detailed instructions to clone, build, and deploy the project, making it accessible for anyone to replicate the setup

## Table of Contents
* Project Overview
* Prerequisites
* Project Structure
* Setup Instructions
* Clone the Repository
* Set Up Azure Resources
* Configure Azure Container Registry (ACR)
* Set Up AKS Cluster
* Configure GitHub Actions Secrets
* Build and Run Locally
* Deploy to AKS via GitHub Actions

## Project Overview
The project automates the deployment of a Node.js application to AKS using a CI/CD pipeline.
- Building a Docker image of the Node.js application.
- Pushing the image to ACR.
- Deploying the image to an AKS cluster using Kubernetes manifests.
- Utilizing GitHub Actions to trigger the pipeline on code pushes to the main branch
## Prerequisites
Before starting, ensure you have the following tools and accounts set up:
- Node.js: Version 18.x or later (download from nodejs.org).
- Docker: Installed and running (install from docker.com).
- Azure CLI: Version 2.30 or later (install from Azure CLI documentation).
- Kubectl: Kubernetes command-line tool (install via Azure CLI or Kubernetes documentation).
- Git: For cloning the repository (install from git-scm.com).
- GitHub Account: For setting up the repository and GitHub Actions.
- Azure Subscription: Active subscription for creating AKS and ACR resources.

## Setup Instructions
Clone the repository to your local machine:
```
git clone https://github.com/your-username/DEPLOY-NODEJS-WITH-GITHUB-PIPELINE-TO-KUBERNATES.git
cd DEPLOY-NODEJS-WITH-GITHUB-PIPELINE-TO-KUBERNATES
```
## Step 2: Set Up Azure Resources
Log in to Azure
```az login
  az group create --name myResourceGroup --location eastus
az acr create --resource-group myResourceGroup --name myAcrRegistry --sku Basic
az acr login --name myAcrRegistry
az acr update --name myAcrRegistry --admin-enabled true
az acr credential show --name myAcrRegistry
az aks create \
  --resource-group myResourceGroup \
  --name myAKSCluster \
  --node-count 2 \
  --enable-addons monitoring \
  --generate-ssh-keys
az aks update \
  --resource-group myResourceGroup \
  --name myAKSCluster \
  --attach-acr myAcrRegistry
az aks get-credentials --resource-group myResourceGroup --name myAKSCluster
kubectl get nodes
```
## Configure GitHub Actions Secrets
Go to your GitHub repository > Settings > Secrets and variables > Actions > New repository secret.
Add the following secrets:
```
AZURE_CREDENTIALS
az ad sp create-for-rbac --name "myApp" --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/myResourceGroup \
  --sdk-auth
```
## Build and Run pipeline
Install Dependencies:
```
cd src
npm install
npm start
docker build -t my-node-app:latest .
docker run -p 3000:3000 my-node-app:latest
doker push my-node-app:latest
git add .
git commit -m "Initial commit"
git push origin main

```
## Github commit 
