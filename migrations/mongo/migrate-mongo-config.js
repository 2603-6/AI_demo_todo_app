const config = {
  mongodb: {
    url: process.env.MONGODB_URL || process.env.DATABASE_URL || 'mongodb://mongo:mongo@localhost:27017/hexagonal_demo?authSource=admin',
    databaseName: 'hexagonal_demo',
  },
  migrationsDir: '.',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
