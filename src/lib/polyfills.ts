import * as Crypto from 'expo-crypto';

// Hermes does not guarantee the Web Crypto API; the tasks store relies on
// crypto.randomUUID(). Import this module before anything else in the app.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  const existing = globalThis.crypto ?? {};
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: Object.assign(existing, { randomUUID: Crypto.randomUUID }),
  });
}
