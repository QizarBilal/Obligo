# Security policy

Obligo treats household documents as confidential by default. Do not use real identity documents in local development or issue reports. Use synthetic fixtures only.

## Product boundaries

- Authentication is supplied by the hosting platform; the application does not store passwords.
- Every durable query must be scoped to a verified household membership.
- Original files belong in private object storage. The relational database stores metadata, reviewed facts, graph edges, and audit events.
- Extracted obligations are proposals until a household member confirms them.
- Document text is untrusted input. It is sanitised, size-limited, and cannot override system instructions.
- Audit metadata rejects credentials, source content, tokens, and document excerpts.
- Payment, submission, and deletion workflows require explicit human confirmation.

## Reporting

Report vulnerabilities privately to the repository owner. Include the affected route, reproducible steps using synthetic data, and impact. Never attach household documents, access tokens, or production records.
