# Deployment Documentation Index

The deployment playbooks in this directory explain how to install Fix Smart CMS on real servers. Use the index below to jump directly to the workflow that matches your environment.

- [Linux Deployment Guide](./linux-deployment.md) – Provision Ubuntu/Debian or RHEL-based servers with PostgreSQL, Nginx or Apache, and PM2.
- [Windows Deployment Guide](./windows-deployment.md) – Deploy on Windows Server with PostgreSQL, Node.js, and optional service registration.
- [Build Deployment (QA / Production)](./build-deployment.md) – Run the application from the pre-built `dist` release bundle without cloning the repository.
- [Configuration Reference](./file-references.md) – Understand every configuration file, required parameters, and how they connect during deployment.

Each guide includes prerequisites, configuration callouts, and verification steps that reflect the checked-in configuration files under `config/`, the PM2 ecosystems, and the Prisma database seed data. Follow the steps in order to avoid missing required environment variables or service wiring.
