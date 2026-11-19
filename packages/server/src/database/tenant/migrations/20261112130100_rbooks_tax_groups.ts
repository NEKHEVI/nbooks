/**
 * NBooks: groupes de taxes (TPS + TVQ), comptes de taxe par taux, composantes
 * de taxe enregistrees par ligne et montant de taxe par document.
 *
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('tax_rates', (table) => {
    table.boolean('is_group').defaultTo(false);
    // Liste JSON des identifiants des taux composants, ex. "[1,2]".
    table.text('component_ids').nullable();
    table.integer('sales_account_id').unsigned().nullable();
    table.integer('purchase_account_id').unsigned().nullable();
    table.string('registration_no', 255).nullable();
  });
  await knex.schema.alterTable('items_entries', (table) => {
    // Composantes de taxe de la ligne (JSON), remplies quand la taxe est un groupe.
    table.text('tax_components').nullable();
  });
  await knex.schema.alterTable('tax_rate_transactions', (table) => {
    // Montant reel de la taxe pour le document (somme des lignes).
    table.decimal('amount', 13, 3).nullable();
  });
};

exports.down = function (knex) {
  return Promise.resolve();
};
