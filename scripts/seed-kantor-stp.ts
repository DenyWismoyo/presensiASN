// @ts-nocheck
import * as dotenv from 'dotenv';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SEED_FIREBASE_UIDS } from '../src/data/seedData';

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
  // 1. Create (or restore) Kantor STP properly
  const kantorId = 'kantor-stp';
  const kantorRef = db.collection('kantor').doc(kantorId);
  
  const kantorData = {
    id: kantorId,
    kodeKantor: 'STP-01',
    namaKantor: 'UPTD KTS Solo Technopark',
    kategori: 'UPTD',
    alamat: 'Jl. Ki Hajar Dewantara No. 19, Jebres, Kota Surakarta',
    koordinat: {
      lat: -7.556111, 
      lng: 110.854444 
    },
    radiusMeter: 200,
    jamMasukMaksimal: '07:30',
    jamPulangMinimal: '16:00',
    orgId: 'org-stp', // Ensure it's org-stp!
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await kantorRef.set(kantorData, { merge: false }); // merge: false to overwrite the dummy data if present
  console.log('✅ Kantor STP restored in Firestore');

  // 2. Update the logged-in admin (Hendra Wijaya) to be in org-stp so the user can see STP data
  await db.collection('users').doc(SEED_FIREBASE_UIDS.admin).update({
    orgId: 'org-stp',
    kantorId: kantorId,
    namaKantor: kantorData.namaKantor,
    instansi: 'UPTD KTS Solo Technopark'
  });
  console.log('✅ Admin user moved to org-stp tenant!');

  // 3. Update all org-stp users again just to be safe
  const snapshot = await db.collection('users').where('orgId', '==', 'org-stp').get();
  console.log(`Found ${snapshot.size} users to update.`);

  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.update(doc.ref, {
      kantorId: kantorId,
      namaKantor: kantorData.namaKantor,
    });
  });

  await batch.commit();
  console.log(`✅ Updated ${snapshot.size} users with kantorId: ${kantorId}`);
}

run().catch(console.error);
