// Client auth helper (imported by index.html via module import).
// Place this file at project root and keep the import in index.html: import './web-auth.js'
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-functions.js";

const auth = getAuth();
const functions = getFunctions();

const adminIcon = document.getElementById('adminIcon');
const adminPanel = document.getElementById('adminPanel');

// Hide admin UI by default
if (adminIcon) adminIcon.style.display = 'none';
if (adminPanel) adminPanel.style.display = 'none';

// Hook auth state and show/hide admin UI based on custom claim
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (adminIcon) adminIcon.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
    return;
  }
  const t = await user.getIdTokenResult(true).catch(() => null);
  if (t && t.claims && t.claims.admin) {
    if (adminIcon) adminIcon.style.display = '';
    // optionally show admin panel automatically:
    // adminPanel.style.display = 'block';
  } else {
    if (adminIcon) adminIcon.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
  }
});

// Helpers to call the Cloud Functions (call from admin UI handlers)
export async function createShipmentViaFn(payload) {
  const fn = httpsCallable(functions, 'adminCreateShipment');
  return fn(payload);
}
export async function updateShipmentViaFn(payload) {
  const fn = httpsCallable(functions, 'adminUpdateShipment');
  return fn(payload);
}
export async function deleteShipmentViaFn(payload) {
  const fn = httpsCallable(functions, 'adminDeleteShipment');
  return fn(payload);
}