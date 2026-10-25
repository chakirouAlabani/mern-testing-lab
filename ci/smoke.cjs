const assert = require('node:assert/strict');
const base = process.env.DEMO_URL || 'http://127.0.0.1:5099';
async function ready() {
  for (let i = 0; i < 30; i++) {
    try { if ((await fetch(base + '/api/users')).status === 401) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Deployed API did not become ready');
}
(async () => {
  await ready();
  assert.match(await (await fetch(base)).text(), /<div id="root"><\/div>/);
  const username = 'ci' + Date.now();
  const signup = await fetch(base + '/api/users/signup', { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({username, email: username+'@example.test', password: 'DemoPassword123!'}) });
  assert.equal(signup.status, 201);
  const cookie = signup.headers.get('set-cookie').split(';')[0];
  const created = await fetch(base + '/api/notes', {method: 'POST', headers: {'content-type':'application/json',cookie}, body:JSON.stringify({title:'Verified release',text:'Built code reaches MongoDB'})});
  assert.equal(created.status, 201);
  const note = await created.json();
  const list = await (await fetch(base + '/api/notes', {headers:{cookie}})).json();
  assert(list.some(item => item._id === note._id && item.title === 'Verified release'));
  const deleted = await fetch(base + '/api/notes/' + note._id, {method:'DELETE', headers:{cookie}});
  assert.equal(deleted.status, 204);
  console.log('SMOKE PASS: compiled React HTML, signup, session cookie, create, database read and delete');
})().catch(error => {console.error(error); process.exitCode=1;});
