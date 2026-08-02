-- À exécuter dans le SQL Editor de Supabase (projet iwqokzqtbyxsfbxyauoj).
--
-- Étape 2 : la page de capture "estimation" (agents) demande l'adresse
-- de la propriété à estimer. Pas de colonne pour ça sur "Leads" -> on
-- l'ajoute en texte libre, nullable (les autres formulaires ne l'envoient
-- pas). Une fiche "properties" complète sera créée manuellement par
-- l'agent dans le CRM une fois le contact établi, pas depuis le formulaire
-- public.

alter table "Leads" add column address text;
