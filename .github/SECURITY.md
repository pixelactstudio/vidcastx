# Security Policy

## Supported Versions

VidcastX is pre-1.0. Security fixes target the `main` branch; downstream users are expected to pull the latest release. Once we tag `v1.0.0` this policy will be revised with a formal support window per major version.

## Reporting a Vulnerability

**Please do not disclose vulnerabilities publicly before a fix is released.**

Preferred channel:

- **GitHub Private Security Advisories:** [Submit a private report](https://github.com/pixelactstudio/vidcastx/security/advisories/new)

Alternative:

- **Email:** chaudhary.dev.talan@gmail.com — PGP available on request.

### What to include

- Affected component (API route, worker, package, etc.)
- Reproduction steps or proof-of-concept
- Impact — what an attacker can do
- Suggested fix, if any

### Response times

- **Acknowledgement:** within 48 hours of receipt.
- **Triage + severity assessment:** within 5 business days.
- **Fix ETA:** communicated after triage; depends on severity and complexity.
- **Disclosure:** coordinated with the reporter; CVE requested for high / critical issues.

## Scope

In scope:

- API endpoints under `apps/api`
- Auth flows (Better-Auth, sessions, M2M tokens)
- Frontend at `apps/app` (XSS, CSRF, leaked tokens)
- Video pipeline (upload presign, transcoder worker)
- Infra-as-code / workflow definitions under `.github/`

Out of scope:

- Self-hosted misconfigurations
- Issues in dependencies already tracked publicly (report upstream)
- DoS via brute force or volumetric attack
- Findings against default-disabled features

## Security Best Practices for Operators

- Run behind TLS. Terminate at a load balancer or reverse proxy.
- Enable **2FA** on your GitHub / hosting / DB provider accounts.
- Rotate `AUTH_SECRET`, OAuth client secrets, and M2M tokens on a regular cadence.
- Use least-privilege IAM for S3 / database / Redis.
- Never commit `.env*` (enforced by `.gitignore` + `.claude/hooks/block-env-file-access.sh`).
- Keep dependencies current — Renovate's `vulnerabilityAlerts` auto-opens security PRs; review and merge promptly.

## Responsible Disclosure

We credit researchers who follow this policy in the security advisory they surface. Thank you for keeping the ecosystem safe.
