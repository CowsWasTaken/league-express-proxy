// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
/* eslint-disable no-undef */
// eslint-disable-next-line no-undef
module.exports = {

	development:  {
		client: 'mysql2',
		connection: {
			host: process.env.DATABASE_HOST,
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			database: process.env.DATABASE_DATABASE,
			port: process.env.DATABASE_PORT
		},
	},

	production: {
		client: 'mysql2',
		connection: {
			host: process.env.DATABASE_HOST,
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			database: process.env.DATABASE_DATABASE,
			port: process.env.DATABASE_PORT
		}
	}

};
