module.exports = {
  async up(db, client) {
    await db.createCollection('users');

    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    );

    console.log('Created users collection with unique email index');
  },

  async down(db, client) {
    await db.collection('users').drop();
    console.log('Dropped users collection');
  }
};
