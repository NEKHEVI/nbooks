// RBooks : numero de TVQ de l'entreprise (le numero de TPS/TVH reutilise la colonne `tax_number` de Bigcapital).
exports.up = function (knex) {
  return knex.schema.table('tenants_metadata', (table) => {
    table.string('tvq_number');
  });
};

exports.down = function (knex) {
  return knex.schema.table('tenants_metadata', (table) => {
    table.dropColumn('tvq_number');
  });
};