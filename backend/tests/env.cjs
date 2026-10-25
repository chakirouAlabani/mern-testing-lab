process.env.SESSION_SECRET = 'workshop-test-secret-only';
process.env.PORT = '5000';
process.env.MONGO_CONNECTION_STRING = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mern_workshop_test';
