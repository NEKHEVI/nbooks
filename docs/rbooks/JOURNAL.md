# Journal RBooks

| Date | Tâche | Résultat | Rapport |
|---|---|---|---|
| 2026-11-12 | Tâche 01 : mise en place | Partiel : docs, nom, AGPL, plans, tests de référence faits ; démarrage local bloqué par Docker | docs/rbooks/rapports/2026-11-12-tache-01-mise-en-place.md |
| 2026-11-12 | Tâche 02 : TPS + TVQ | Fait : précision 9,5, groupes de taxes, calcul par ligne, grand livre par taxe, démo locale avec données fictives ; reste écran de groupes | docs/rbooks/rapports/2026-11-12-tache-02-taxes-qc.md |
| 2026-11-12 | Tâche 06 : français québécois | Fait : webapp + serveur fr-CA, tests verts, build OK | docs/rbooks/rapports/2026-11-12-tache-06-francais.md |
| 2026-11-12 | Préparation de la démo | Fait : organisation en français, rapports en comptabilité d'exercice, Garage réparé (pièces jointes), groupes de taxes dans l'écran Taux de taxe, capture de bout en bout vérifiée, script de démarrage | docs/rbooks/DEMO-DEMAIN.md |
| 2026-11-12 | 08 connexion démo | Variable RBOOKS_DEMO_ANY_LOGIN=1 (serveur, désactivée par défaut) : tout identifiant ouvre le compte demo@rbooks.test. Actif seulement dans le .env local. À retirer ou laisser désactivé hors démo. |
| 2026-11-13 | Tâche 09 : CTI/RTI automatiques | Fait : capture -> facture fournisseur avec CTI/RTI aux comptes de TPS/TVQ à recevoir, repas à 50 %, rien réclamé sans no de TPS/TVQ (note sur la facture), total au cent près, 13 tests pytest | docs/rbooks/rapports/2026-11-13-tache-09-cti-rti-capture.md |
| 2026-11-13 | Tâche 10 : numéros de taxes | Fait : No TPS/TVH et No TVQ dans les paramètres de l'organisation, imprimés sur les PDF et l'aperçu ; nouvelle migration système | docs/rbooks/rapports/2026-11-13-tache-10-numeros-taxes.md |
| 2026-11-13 | Tâche 11 : plan comptable QC | Fait : 72 comptes en français semés pour fr-CA / CA-QC, sans doublon de taxes ; à valider par un CPA | docs/rbooks/PLAN-COMPTABLE-QC.md |
| 2026-11-13 | Tâche 12 : rapport de taxes | Fait : Sommaire de la taxe de vente avec TPS/TVQ séparées, taxe perçue, payée (CTI/RTI) et nette | docs/rbooks/rapports/2026-11-13-tache-12-rapport-taxes.md |
