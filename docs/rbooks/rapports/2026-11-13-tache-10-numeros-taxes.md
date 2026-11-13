# Rapport tâche 10 : numéros de TPS et de TVQ de l'entreprise sur les documents (2026-11-13)

Branche `rbooks/10-numeros-taxes`, fusionnée dans `rbooks/main`. Aucun push.

## Ce qui a été fait

- **Réglages de l'organisation** (Préférences > Général) : le champ fiscal existant de Bigcapital (`taxNumber`, colonne `tax_number` de `tenants_metadata`) devient « No de TPS/TVH » ; nouveau champ « No de TVQ » (`tvqNumber`) juste dessous. Textes en français (fr) ; en/es/sv reçoivent un libellé anglais pour la nouvelle clé.
- **Stockage** : une NOUVELLE migration de la base système (`packages\server\src\database\system\migrations\20261113000001_rbooks_add_tvq_number_to_tenants_metadata.js`, colonne `tvq_number`, aucune migration existante modifiée). Raison : les réglages clé-valeur auraient exigé de lire un autre magasin dans chaque service de PDF et de courriel ; avec la colonne, la même ligne de métadonnées alimente l'API, les PDF et l'aperçu. Appliquée avec `pnpm run system:migrate:latest` (à relancer sur toute autre installation).
- **Affichage** : `TenantMetadata.addressTextFormatted` ajoute après l'adresse « TPS : 123456789 RT0001 » et « TVQ : 1234567890 TQ0001 » (module `packages\server\src\modules\RBooksQuebecTax\organizationTaxNumbers.ts`, valeurs nettoyées par sanitize-html, aucune ligne vide, rien d'affiché si le numéro est absent). Comme cette adresse alimente tous les modèles de PDF (`GetOrganizationBrandingAttributes`), les numéros apparaissent sur : facture de vente, soumission, reçu de vente, note de crédit (et reçu de paiement), ainsi que dans l'aperçu du webapp (état des modèles `/api/pdf-templates/state`, utilisé par le panneau de personnalisation) et l'aperçu du lien de paiement. Aucun gabarit React modifié.
- **Organisation de démo** : numéros FICTIFS 123456789 RT0001 et 1234567890 TQ0001.

## Vérification

- PDF générés par Gotenberg et inspectés visuellement (rendu PyMuPDF) : facture FAC-0001, soumission, reçu de vente, note de crédit (les trois derniers créés puis supprimés pour le test). Texte extrait : les deux lignes sont présentes dans chacun. Captures : `C:\DEV\CODEGOD\RAWLF\rbooks\docs\rbooks\captures-numeros\` (02 à 05 = PDF, 01 = écran des réglages).
- `/api/pdf-templates/state` pour SaleInvoice, SaleEstimate, SaleReceipt, CreditNote : `companyAddress` contient les deux numéros.
- Tests Jest serveur : 602 réussis, 1 échec déjà présent avant (`TransactionsByCustomersPdf.spec.ts`). 6 nouveaux tests (`organizationTaxNumbers.spec.ts`). `pnpm run build:server` et `pnpm run build:webapp` réussis.

## Limites

- Les gabarits de PDF restent en anglais (« Invoice », « Billed To ») : seuls les libellés des numéros sont en français. Un français complet des PDF est une tâche à part.
- Le SDK TypeScript généré (`shared\sdk-ts`) n'a pas été régénéré (champ `tvqNumber` absent des types générés ; sans effet sur l'exécution).
- Le format des numéros n'est pas validé (RT0001, TQ0001) : saisie libre.
- Un aperçu visuel du panneau de personnalisation dans le navigateur n'a pas pu être capturé (accès au panneau non automatisable) ; l'aperçu lit exactement les données vérifiées ci-dessus.
- À valider par un CPA : emplacement et libellé des numéros (TPS/TVH, TVQ) exigés sur les factures.