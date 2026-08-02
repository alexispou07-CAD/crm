-- À exécuter dans le SQL Editor de Supabase.
--
-- Un test en anonyme a montré qu'un lead pouvait être créé directement avec
-- Stage = 'client' malgré notre policy "public can create a new lead".
-- Cause : une policy reliquat, "Formulaire public - ajout seulement",
-- s'applique à {anon, authenticated} en INSERT avec with_check = true
-- (aucune restriction) — elle autorise donc n'importe quel insert et
-- annule la restriction Stage='nouveau' de notre propre policy (les
-- policies RLS s'additionnent en OR : une seule policy permissive suffit).
--
-- On la supprime. On supprime aussi les deux policies SELECT
-- "Utilisateurs connectés - accès complet" (authenticated), redondantes
-- avec "staff full access on Leads/Notes" qui couvre déjà SELECT.

-- "if exists" : chaque suppression est indépendante, une ligne qui ne
-- correspond à rien (ex. nom légèrement différent) n'annule pas les autres.
drop policy if exists "Formulaire public - ajout seulement" on "Leads";
drop policy if exists "Utilisateurs connectés - accès complet" on "Leads";
drop policy if exists "Utilisateurs connectés - accès complet" on "Notes";

-- Vérification : ne doit rester que 3 policies au total.
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies where tablename in ('Leads','Notes');

-- Nettoyage des deux lignes de test insérées pendant les tests RLS
-- (impossible à faire en anonyme, RLS bloque bien le DELETE public — donc
-- il faut le faire ici, en tant que staff/postgres).
delete from "Leads" where name in ('TEST_RLS_CHECK', 'TEST_RLS_CHECK_2');
