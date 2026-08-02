-- À exécuter dans le SQL Editor de Supabase (projet iwqokzqtbyxsfbxyauoj).
--
-- Contexte découvert via pg_constraint / information_schema :
--   - "Leads" a déjà une clé primaire : PRIMARY KEY (name). Donc pas de
--     colonne "id" à ajouter ici — un lead est identifié par son name.
--   - "Notes" a une clé primaire sur (lead_id), ce qui rend lead_id UNIQUE
--     et limite chaque lead à UNE SEULE note. L'app attend un historique
--     de plusieurs notes par lead : on retire cette PK et on donne à
--     "Notes" son propre id, avec lead_id en colonne normale (indexée,
--     pas unique) qui référence Leads(name).
--   - Aucune des deux tables n'a de colonne created_at : on l'ajoute.

-- ============================================================
-- 1) Leads : juste ajouter created_at (la PK existe déjà sur name)
-- ============================================================

alter table "Leads" add column created_at timestamptz not null default now();

-- ============================================================
-- 2) Notes : remplacer la PK sur lead_id par un vrai id, et permettre
--    plusieurs notes par lead
-- ============================================================

-- Retire l'ancienne contrainte (limite à 1 note/lead). Le nom exact de la
-- contrainte peut varier ; vérifie-le avec la requête pg_constraint donnée
-- plus tôt si celui-ci ne correspond pas.
alter table "Notes" drop constraint "Notes_pkey";

alter table "Notes" add column id uuid primary key default gen_random_uuid();
alter table "Notes" add column created_at timestamptz not null default now();

create index notes_lead_id_idx on "Notes" (lead_id);

-- Optionnel : lie chaque note à un lead existant. À activer seulement si
-- "lead_id" est bien du même type que "Leads.name" (vérifier avec :
--   select data_type from information_schema.columns
--   where table_name = 'Notes' and column_name = 'lead_id';
-- ).
-- alter table "Notes"
--   add constraint notes_lead_id_fkey foreign key (lead_id) references "Leads"(name) on delete cascade;

-- ============================================================
-- 3) RLS : personnel connecté = accès complet, public = création seulement
-- ============================================================

alter table "Leads" enable row level security;
alter table "Notes" enable row level security;

-- --- Personnel connecté (CRM) : accès complet ---
create policy "staff full access on Leads"
  on "Leads"
  for all
  to authenticated
  using (true)
  with check (true);

create policy "staff full access on Notes"
  on "Notes"
  for all
  to authenticated
  using (true)
  with check (true);

-- --- Public (formulaire de capture, non authentifié) : création seulement ---
create policy "public can create a new lead"
  on "Leads"
  for insert
  to anon
  with check ("Stage" = 'nouveau');

-- Aucune policy anon pour SELECT / UPDATE / DELETE sur "Leads" : la lecture,
-- la modification et la suppression restent réservées au personnel connecté.
-- Aucune policy anon sur "Notes" : le formulaire public n'y touche jamais.
