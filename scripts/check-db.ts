// @ts-nocheck
import * as dotenv from 'dotenv';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } else if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
    initializeApp({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

const db = getFirestore();
db.settings({ databaseId: 'presensi-pegawai' });

async function run() {
  const snap = await db.collection('users').get();
  console.log(`Ada ${snap.size} user di Firestore:`);
  snap.docs.forEach(d => {
    console.log(`- ${d.data().nama} (${d.data().orgId}) [kantorId: ${d.data().kantorId}]`);
  });
}

run().catch(console.error);
