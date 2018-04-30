
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('counsellors', (table) => {
      table.increments('counsellor_id').primary();
      table.string('full_name');
      table.string('email').unique();
      table.string('password_hash');
      table.string('name_of_practice');
      table.string('name_avatar_url');

      table.timestamps(true, true);
    }),

    knex.schema.createTable('clients', (table) => {
      table.increments('client_id').primary();
      table.string('full_name');
      table.string('email').unique();
      table.string('password_hash');
      table.text('issues_dealing_with');
      table.string('name_avatar_url');
      table.integer('client_counsellor_id')
        .references('counsellor_id')
        .inTable('counsellors');

      table.timestamps(true, true);
    }),

    knex.schema.createTable('journal_entries', (table) => {
      table.increments('entry_id').primary();
      table.string('title');
      table.text('encrypted_content');
      table.integer('entry_maker_id')
        .references('client_id')
        .inTable('clients');

      table.timestamps(true, true);
    }),

    knex.schema.createTable('counsellor_notes', (table) => {
      table.increments('note_id').primary();
      table.string('title');
      table.text('encrypted_content');
      table.integer('for_id')
        .references('client_id')
        .inTable('clients');
      table.integer('note_maker_id')
        .references('counsellor_id')
        .inTable('counsellors');

      table.timestamps(true, true);
    }),

    knex.schema.createTable('personality_insights', (table) => {
      table.increments('personality_insight_id').primary();
      table.text('encrypted_json_blob');
      table.integer('journal_entry_id')
        .references('entry_id')
        .inTable('journal_entries');

      table.timestamps(true, true);
    }),

    knex.schema.createTable('natural_language_insights', (table) => {
      table.increments('natural_language_insight_id').primary();
      table.text('encrypted_json_blob');
      table.integer('journal_entry_id')
        .references('entry_id')
        .inTable('journal_entries');

      table.timestamps(true, true);
    }),

    knex.schema.createTable('tone_insights', (table) => {
      table.increments('tone_insight_id').primary();
      table.text('encrypted_json_blob');
      table.integer('journal_entry_id')
        .references('entry_id')
        .inTable('journal_entries');

      table.timestamps(true, true);
    }),

    knex.schema.createTable('online_resources', (table) => {
      table.increments('resource_id').primary();
      table.string('title');
      table.string('link');
      table.text('description');
      table.string('tags');

      table.timestamps(true, true);
    })

  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('counsellors'),
    knex.schema.dropTable('clients'),
    knex.schema.dropTable('journal_entries'),
    knex.schema.dropTable('counsellor_notes'),
    knex.schema.dropTable('personality_insights'),
    knex.schema.dropTable('natural_language_insights'),
    knex.schema.dropTable('tone_insights'),
    knex.schema.dropTable('online_resources')
  ])
};
