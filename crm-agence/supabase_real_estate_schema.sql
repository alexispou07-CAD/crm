-- À exécuter dans le SQL Editor de Supabase (projet iwqokzqtbyxsfbxyauoj).
--
-- Étape 1 du pivot vers un CRM immobilier ciblé (agents/courtiers +
-- propriétaires de blocs). Voir discussion : nouveau cycle de Stage,
-- rôle du lead, table Properties.
--
-- Convention : toute nouvelle colonne/table est en minuscule (snake_case)
-- sans guillemets. Phone/Source/Stage restent capitalisés sur "Leads" par
-- compatibilité avec le code existant — les renommer casserait tout le
-- code pour un gain cosmétique.

-- =========================================================
-- 1) LEADS : ajout du rôle + migration des valeurs de Stage
-- =========================================================

alter table "Leads" add column role text
  check (role in ('acheteur', 'vendeur', 'locataire', 'proprietaire'));

-- Migration des valeurs existantes vers le nouveau cycle immobilier :
--   nouveau  -> nouveau           (inchangé)
--   contacte -> contact_etabli
--   qualifie -> visite_planifiee
--   client   -> vendu_loue
--   perdu    -> perdu             (inchangé)
update "Leads" set "Stage" = 'contact_etabli' where "Stage" = 'contacte';
update "Leads" set "Stage" = 'visite_planifiee' where "Stage" = 'qualifie';
update "Leads" set "Stage" = 'vendu_loue' where "Stage" = 'client';

-- Verrouille les valeurs valides désormais (à lancer seulement une fois
-- les updates ci-dessus passés, sinon une ligne existante hors liste
-- ferait échouer la contrainte).
alter table "Leads" add constraint leads_stage_check
  check ("Stage" in ('nouveau', 'contact_etabli', 'visite_planifiee', 'offre_bail', 'vendu_loue', 'perdu'));

-- Note : les valeurs de Source (Centris/MLS, Facebook Ads, Référencement,
-- Panneau, Site web, Bouche-à-oreille) ne sont pas contraintes en base
-- (colonne texte libre) — le changement se fait uniquement côté code
-- (étape suivante).

-- =========================================================
-- 2) PROPERTIES : nouvelle table
-- =========================================================

create table properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  type text not null check (type in ('maison', 'condo', 'bloc_appartements', 'commercial')),
  transaction_type text not null check (transaction_type in ('vente', 'location')),
  price numeric,                      -- prix de vente OU loyer mensuel, selon transaction_type
  status text not null default 'a_vendre'
    check (status in ('a_vendre', 'a_louer', 'vendue', 'louee', 'retiree')),
  lead_name text references "Leads"(name) on delete set null,  -- lead/propriétaire associé
  created_at timestamptz not null default now()
);

create index properties_lead_name_idx on properties (lead_name);
create index properties_status_idx on properties (status);

alter table properties enable row level security;

-- Personnel connecté : accès complet
create policy "staff full access on properties"
  on properties
  for all
  to authenticated
  using (true)
  with check (true);

-- Public : lecture seule des propriétés actives (pour la future page
-- "nouvelles inscriptions" côté agents)
create policy "public can view active properties"
  on properties
  for select
  to anon
  using (status in ('a_vendre', 'a_louer'));
