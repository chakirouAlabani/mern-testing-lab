import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../../src/app';
import Note from '../../src/models/note';
import User from '../../src/models/user';
const uri = process.env.MONGO_CONNECTION_STRING!;
if (!uri.endsWith('/mern_workshop_test')) throw Error('Refusing non-test database');
const app = createApp(); // MemoryStore is limited to this short-lived test process.
beforeAll(async () => {
  await mongoose.connect(uri);
});
beforeEach(async () => {
  await Promise.all([Note.deleteMany({}), User.deleteMany({})]);
});
afterAll(async () => {
  await mongoose.disconnect();
});
async function account(name: string) {
  const agent = request.agent(app);
  await agent
    .post('/api/users/signup')
    .send({
      username: name,
      email: name + '@example.test',
      password: 'Workshop123!',
    })
    .expect(201);
  return agent;
}
test('anonymous requests and unknown routes', async () => {
  await request(app)
    .get('/api/notes')
    .expect(401)
    .expect({ error: 'User not authenticated' });
  await request(app).get('/not-a-route').expect(404);
});
test('CRUD persists changes and logout revokes access', async () => {
  const agent = await account('alice');
  await agent.post('/api/notes').send({ text: 'missing title' }).expect(400);
  const created = await agent
    .post('/api/notes')
    .send({ title: 'First', text: 'Body' })
    .expect(201);
  const id = created.body._id;
  expect(await Note.findById(id)).toEqual(
    expect.objectContaining({ title: 'First' }),
  );
  const list = await agent.get('/api/notes').expect(200);
  expect(list.body.map((n: any) => n._id)).toEqual([id]);
  await agent.get('/api/notes/' + id).expect(200);
  await agent
    .patch('/api/notes/' + id)
    .send({ title: 'Revised' })
    .expect(200);
  expect((await Note.findById(id))?.title).toBe('Revised');
  await agent.delete('/api/notes/' + id).expect(204);
  expect(await Note.findById(id)).toBeNull();
  await agent.get('/api/notes/' + id).expect(404);
  await agent.post('/api/users/logout').expect(200);
  await agent.get('/api/notes').expect(401);
});
test('another account cannot read change or delete a note', async () => {
  const owner = await account('owner');
  const other = await account('other');
  const { body } = await owner
    .post('/api/notes')
    .send({ title: 'Private' })
    .expect(201);
  const path = '/api/notes/' + body._id;
  await other.get(path).expect(401);
  await other.patch(path).send({ title: 'Stolen' }).expect(401);
  await other.delete(path).expect(401);
  expect((await other.get('/api/notes').expect(200)).body).toEqual([]);
  expect((await Note.findById(body._id))?.title).toBe('Private');
  await owner.get('/api/notes/invalid').expect(400);
  await owner.patch(path).send({ title: '' }).expect(400);
});
test('duplicate signup and login credentials', async () => {
  await account('loginuser');
  await request(app)
    .post('/api/users/signup')
    .send({ username: 'loginuser', email: 'new@example.test', password: 'pw' })
    .expect(409);
  await request(app)
    .post('/api/users/login')
    .send({ username: 'loginuser', password: 'wrong' })
    .expect(401);
  const agent = request.agent(app);
  await agent
    .post('/api/users/login')
    .send({ username: 'loginuser', password: 'Workshop123!' })
    .expect(201);
  expect((await agent.get('/api/users').expect(200)).body.username).toBe(
    'loginuser',
  );
});
