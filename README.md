# ⚾ Baseball Stats — DevOps Project

## What This Project Is

A batting statistics dashboard for an amateur baseball team. The app reads a CSV file of plate appearances and calculates MLB-standard metrics — AVG, OBP, SLG, OPS.

The frontend is Angular 21 with a sortable, filterable table, color-coded rate stats, team summary cards, and a loading state that fetches the CSV at runtime — so updating stats for a new game requires only updating one file.

That is the entire application. What makes this a DevOps project is everything wrapped around it.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Angular 21 (standalone, signals, zoneless) | Stats dashboard UI |
| Data | Python + pandas | Stat calculation and CSV validation |
| Containerisation | Docker + Nginx | Portable, reproducible app packaging |
| Orchestration | Kubernetes + minikube | Local container management and scaling demo |
| CI/CD | GitHub Actions | Automated validation, build, and deployment |
| Hosting | GitHub Pages | Free static site hosting |
| Version control | Git + GitHub | Source of truth for all code and config |

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