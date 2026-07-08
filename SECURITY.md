# Security Policy

## Supported versions

Only the latest `0.x` release is supported.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report privately via GitHub's private vulnerability reporting:

<https://github.com/foobarjs/foobarjs/security/advisories/new>

You should receive an acknowledgment within 72 hours. If you do not, please
follow up via issue (without disclosing details) so we know to look.

We aim to publish a fix and a coordinated disclosure within 30 days for high
severity issues.

## Scope

In scope:

- Framework source (this repo)
- Demo repo insofar as it demonstrates a framework issue
- Documented usage patterns

Out of scope:

- Vulnerabilities in third-party dependencies that are already tracked
  upstream (please report to that project instead)
- Issues that require the attacker to already have root access to the host
- Denial of service via unrealistic request volumes
- Missing security headers with no demonstrable impact
