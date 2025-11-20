// Cloud Functions (callable) for admin operations.
// Place in functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Utility: basic validation helper
function validateShipmentInput(data) {
  if (!data) throw new functions.https.HttpsError('invalid-argument', 'Missing data');
  const { origin, destination } = data;
  if (!origin || !destination) throw new functions.https.HttpsError('invalid-argument', 'origin and destination required');
  // add more validation as needed (lengths, allowed statuses, coords)
}

exports.adminCreateShipment = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  if (!context.auth.token || !context.auth.token.admin) throw new functions.https.HttpsError('permission-denied', 'Admin only');

  validateShipmentInput(data);

  const code = data.code || `ST${Date.now()}`;
  const docRef = admin.firestore().collection('shipments').doc(code);

  const payload = {
    origin: data.origin,
    destination: data.destination,
    status: data.status || 'Shipment Created',
    location: data.location || data.origin,
    history: Array.isArray(data.history) ? data.history : (data.history ? [data.history] : ['Shipment created']),
    coords: Array.isArray(data.coords) ? data.coords : (data.coords ? data.coords : []),
    eta: data.eta || `${Math.floor(Math.random()*6)+1} days`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: context.auth.uid
  };

  await docRef.set(payload);
  return { ok: true, id: docRef.id };
});

exports.adminUpdateShipment = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  if (!context.auth.token || !context.auth.token.admin) throw new functions.https.HttpsError('permission-denied', 'Admin only');

  const id = data.id || data.code;
  if (!id) throw new functions.https.HttpsError('invalid-argument', 'id/code required');

  const updates = data.updates || {};
  // Basic validation for updates can be added here
  updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  updates.updatedBy = context.auth.uid;

  await admin.firestore().collection('shipments').doc(id).update(updates);
  return { ok: true, id };
});

exports.adminDeleteShipment = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  if (!context.auth.token || !context.auth.token.admin) throw new functions.https.HttpsError('permission-denied', 'Admin only');

  const id = data.id || data.code;
  if (!id) throw new functions.https.HttpsError('invalid-argument', 'id/code required');

  await admin.firestore().collection('shipments').doc(id).delete();
  return { ok: true, id };
});