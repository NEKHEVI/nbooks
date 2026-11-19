/**
 * NBooks: passe les colonnes de taux de taxe en DECIMAL(9,5) pour que 9,975 %
 * (TVQ) ne soit pas arrondi a 9,98 %.
 *
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('tax_rates', (table) => {
    table.decimal('rate', 9, 5).alter();
  });
  await knex.schema.alterTable('tax_rate_transactions', (table) => {
    table.decimal('rate', 9, 5).unsigned().alter();
  });
  await knex.schema.alterTable('items_entries', (table) => {
    table.decimal('tax_rate', 9, 5).unsigned().alter();
  });
  await knex.schema.alterTable('accounts_transactions', (table) => {
    table.decimal('tax_rate', 9, 5).unsigned().alter();
  });
};

exports.down = function (knex) {
  return Promise.resolve();
};
