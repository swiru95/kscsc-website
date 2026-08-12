/**
 * Blog article registry.
 * Add new entries here when publishing a new post.
 * The `slug` must match the filename (without .md) in blogs/.
 */
var BLOG_ARTICLES = [
    {
        slug: 'llmbriefing',
        title: 'A Daily Threat Briefing an LLM Can Be Trusted With',
        date: '2026-08-12',
        description: 'Ninety RSS feeds, local embeddings and verified primary sources — using a model only where judgement is actually needed.'
    },
    {
        slug: 'crushftpharness',
        title: 'CrushFTP Pentest Harness',
        date: '2025-06-27',
        description: 'A harness for pentesting CrushFTP servers in local environment.'
    },
    {
        slug: 'macoslogs',
        title: 'macOS Security Log Forwarding to Splunk via AWS S3',
        date: '2026-04-26',
        description: 'Forward macOS security logs to Splunk through S3 using IAM Roles Anywhere and X.509 device identity.'
    },
    {
        slug: 'yubica',
        title: 'PKI Setup with YubiKey Root CA',
        date: '2025-04-10',
        description: 'Two-tier PKI with Root CA on YubiKey 5 and software Intermediate CA.'
    },
    {
        slug: 'wafkscsc',
        title: 'KSCSC Well Architected Framework v1',
        date: '2025-04-10',
        description: 'Well Architected Framework by KSCSC, covers 7 pillars based on AWS and Azure well architected frameworks.'
    }
];
