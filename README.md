# ⚾ Baseball Stats — DevOps Project

## What This Project Is

A batting statistics dashboard for an amateur baseball team. The app reads a CSV file of plate appearances and calculates MLB-standard metrics — AVG, OBP, SLG, OPS.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | [![Angular](https://img.shields.io/badge/Angular-%23DD0031.svg?logo=angular&logoColor=white)](#) | Stats dashboard UI |
| Data | [![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=fff)](#) / [![Pandas](https://img.shields.io/badge/Pandas-150458?logo=pandas&logoColor=fff)](#) | Stat calculation and CSV validation |
| Containerisation | [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)](#) / [![nginx](https://img.shields.io/badge/nginx-009639?logo=nginx&logoColor=fff)](#) | Portable, reproducible app packaging |
| Orchestration | [![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=fff)](#) | Local container management and scaling demo |
| CI/CD | [![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](#) | Automated validation, build, and deployment |
| Hosting | [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-121013?logo=github&logoColor=white)](#) | Free static site hosting |
| Version control | [![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=fff)](#) / [![GitHub](https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white)](#) | Source of truth for all code and config |

---

## CI/CD Pipeline — How It Works

The pipeline is defined in `.github/workflows/deploy.yml`. It runs automatically on every push to `main`.

### Job dependency chain

```
push to main
     │
     ▼
┌─────────────────┐
│ validate-stats  │  Python 3.11 + pandas
│                 │  runs calculate_stats.py
│                 │  if CSV is malformed or missing → STOP
└────────┬────────┘
         │ needs: validate-stats
         ▼
┌─────────────────┐
│     build       │  Node 24 + Angular CLI
│                 │  npm ci (clean install)
│                 │  npx ng build --configuration production
│                 │  --base-href /ichiban-devops/
│                 │  uploads docs/browser/ as Pages artifact
└────────┬────────┘
         │ needs: build
         ▼
┌─────────────────┐
│     deploy      │  actions/deploy-pages
│                 │  publishes artifact to GitHub Pages
│                 │  site is live
└─────────────────┘
```
---

## DevOps Concepts Demonstrated

| Concept | Where it appears in this project |
|---|---|
| Infrastructure as Code | `Dockerfile`, `deployment.yaml`, `deploy.yml` — all infrastructure described as files in version control |
| CI (Continuous Integration) | Job 1 validates data on every push — catches errors before they reach production |
| CD (Continuous Deployment) | Jobs 2 and 3 build and deploy automatically — no manual steps after `git push` |
| Containerisation | Multi-stage Dockerfile packages app + Nginx into a portable, reproducible image |
| Container orchestration | `deployment.yaml` declares desired state (2 replicas); Kubernetes maintains it |
| Self-healing infrastructure | Kubernetes restarts crashed pods automatically — demonstrated with `kubectl delete pod` |
| Build artifact | Angular compiles to static files; uploaded as a GitHub Pages artifact — immutable, versioned |
| Environment separation | Local (minikube) vs CI (GitHub runners) vs production (GitHub Pages) — three independent systems |
| Secrets management | `GITHUB_TOKEN` used in deploy step — stored encrypted, never visible in logs |
| Declarative configuration | Kubernetes YAML describes desired state, not imperative steps |
| Pipeline gates | Each job must pass before the next runs — bad data cannot reach production |

---

## Links

- **Live site:** https://lombardi-g.github.io/ichiban-devops/
- **Actions runs:** https://github.com/lombardi-g/ichiban-devops/actions
- **Kubernetes basics:** https://kubernetes.io/docs/tutorials/kubernetes-basics/
- **GitHub Actions docs:** https://docs.github.com/en/actions
- **DevOps roadmap:** https://roadmap.sh/devops
