# 📜 Engineering Log: The Azure Architecture Pivot

*This document serves as a permanent postmortem and architectural log. It exists so that future engineers, recruiters, and open-source contributors can see the exact struggles I faced during deployment, the lessons I learned, and why this repository is architected the way it is.*

---

## 🛑 The Initial Goal: Raw Kubernetes (AKS)
I initially pursued a raw Azure Kubernetes Service (AKS) cluster on the recommendation of a peer who suggested it as the industry standard. I wanted maximum control over the orchestration layer and the ability to say I built it from scratch.

## 📉 The Constraint: Cloud Capacity & Resource Tiers
I executed an elite **Infrastructure as Code (Terraform)** approach to safely provision the cluster in `Central US`. However, Terraform's strict state management caught a critical limitation: Azure successfully built the Kubernetes *Control Plane* but lacked the capacity to provision the *Virtual Machine Scale Sets* on my Pay-As-You-Go subscription tier. 

While Kubernetes remains the undisputed standard for enterprise teams with dedicated, reserved hardware agreements, I recognized that pursuing it on a solo, dynamically-allocated resource tier was structurally fragile.

## 🚀 The Solution: Serverless Orchestration (ACA)
Rather than abandoning the cloud deployment, I executed a ruthless architectural pivot to **Azure Container Apps (ACA)**. By leveraging Serverless orchestration, I bypassed the raw Virtual Machine allocation drought entirely. This allowed me to deploy the exact same containerized microservices into Microsoft's existing hardware pool, achieving the same cloud-native routing with significantly higher resilience. 

## 🧠 Key Takeaways (The Rajan Protocol)
1. **Anti-Fragility:** Single points of failure in the cloud (like region-specific hardware droughts) must be bypassed using flexible, abstract orchestration.
2. **Proactive Architecture:** Always pitch the elite enterprise standard (IaC / Serverless) *before* attempting brute-force imperative deployments.
3. **Zero Attachment:** I abandoned a 60-minute Kubernetes build without hesitation because I am attached to the *growth and the goal*, not the specific technology.
