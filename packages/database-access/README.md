# Database Access

`@bubbles/database-access` enthält kleine, app-neutrale Helfer für
serverseitigen Datenbanktransport in Bubblesverse-Apps.

Aktuell teilt das Paket nur die HMR-sichere Postgres.js-Client-Erzeugung mit
konservativen Timeout-Defaults. App-Schemas, Drizzle-Relations,
Autorisierung, RLS-Policies und Business-Queries bleiben bewusst in den Apps.
