// This file is executed with backend/ as the current directory.
const mongoose = require('../backend/node_modules/mongoose');
const uri = process.env.TEST_MONGO_URI;
if (!uri || !uri.endsWith('/mern_workshop_test')) {
  throw new Error('TEST_MONGO_URI must name the isolated mern_workshop_test database');
}
(async () => {
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1000 });
      await mongoose.connection.db.admin().ping();
      await mongoose.disconnect();
      console.log('Test MongoDB is ready');
      return;
    } catch (error) {
      await mongoose.disconnect();
      if (attempt === 20) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
