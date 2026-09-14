# Supabase & Drizzle Migrations

Database migrations for the WDS platform are managed centrally via Supabase CLI and Drizzle ORM.
The canonical migration files reside in:
`supabase/migrations/`

Key migrations:
- `00001_enable_extensions.sql`: UUID and cryptographic extensions
- `00002_create_tables.sql`: Core tables (`users`, `roles`, `user_roles`, `customers`, `addresses`, `products`, `price_lists`, `audit_log`, `domain_events`, `notifications`)
- `00003_helper_functions.sql`: `current_user_roles()`, `has_role()`, `has_any_role()`
- `00004_rls_policies.sql`: Row Level Security policies across all 8 roles
