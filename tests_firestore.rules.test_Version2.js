/**
 * Firestore rules unit test for the firestore.rules file.
 *
 * Instructions:
 * 1) npm init -y
 * 2) npm i -D @firebase/rules-unit-testing firebase-admin mocha
 * 3) place firestore.rules in repo root (same directory)
 * 4) run tests with: npx mocha tests/firestore.rules.test.js --timeout 10000
 *
 * This test verifies:
 * - public read allowed
 * - unauthenticated write is denied
 * - admin (custom claim) write is allowed
 */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'swiftshipco-rules-test';

describe('Firestore rules', () => {
  let testEnv;

  before(async () => {
    const rules = fs.readFileSync(path.resolve(__dirname, '..', 'firestore.rules'), 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('allows public reads for shipments', async () => {
    const unauth = testEnv.unauthenticatedContext();
    const db = unauth.firestore();
    // prepare a doc as admin (setup)
    const adminCtx = testEnv.authenticatedContext('seed-admin', { admin: true });
    const adminDb = adminCtx.firestore();
    await assertSucceeds(adminDb.collection('shipments').doc('SEED1').set({ origin: 'X', destination: 'Y', status: 'Created' }));

    // now unauthenticated client should be able to read
    await assertSucceeds(db.collection('shipments').doc('SEED1').get());
  });

  it('denies unauthenticated writes to shipments', async () => {
    const unauth = testEnv.unauthenticatedContext();
    const db = unauth.firestore();
    await assertFails(db.collection('shipments').doc('BAD1').set({ origin: 'A' }));
  });

  it('allows authenticated admin writes to shipments', async () => {
    const admin = testEnv.authenticatedContext('admin-uid', { admin: true });
    const db = admin.firestore();
    await assertSucceeds(db.collection('shipments').doc('ADMIN1').set({ origin: 'A', destination: 'B', status: 'Created' }));
  });

  it('denies non-admin authenticated writes to shipments', async () => {
    const user = testEnv.authenticatedContext('user-uid', { });
    const db = user.firestore();
    await assertFails(db.collection('shipments').doc('USER1').set({ origin: 'A' }));
  });

  it('allows create subscriber publicly', async () => {
    const unauth = testEnv.unauthenticatedContext();
    const db = unauth.firestore();
    await assertSucceeds(db.collection('subscribers').doc('a@b.com').set({ email: 'a@b.com' }));
  });

  it('denies update/delete to subscribers by non-admin', async () => {
    const admin = testEnv.authenticatedContext('admin-uid', { admin: true });
    const adminDb = admin.firestore();
    await assertSucceeds(adminDb.collection('subscribers').doc('a@b.com').set({ email: 'a@b.com' }));

    const user = testEnv.authenticatedContext('user-uid', {});
    const userDb = user.firestore();
    await assertFails(userDb.collection('subscribers').doc('a@b.com').update({ phone: '123' }));
    await assertFails(userDb.collection('subscribers').doc('a@b.com').delete());
  });
});