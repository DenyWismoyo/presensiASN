// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { parse } from 'csv-parse/sync';

import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Manually initialize admin for this standalone script
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
const auth = getAuth();

async function syncCodes() {
  const usersCsvPath = 'd:/Project/GAWE/PresensiASN/src/data/stp-users.csv';
  const csvData = fs.readFileSync(usersCsvPath, 'utf8');

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  const credentialsOutput = ['Nama,Jabatan,Email,AccessCode,Password'];

  console.log(`Syncing ${records.length} users to Firestore...`);

  for (const user of records) {
    const email = user.email.trim();
    const accessCode = user.accessCode.trim();
    
    // Find user by email in auth to get uid
    try {
      const userRecord = await auth.getUserByEmail(email);
      const uid = userRecord.uid;
      
      // Update Firestore
      await db.collection('users').doc(uid).update({
        accessCode: accessCode
      });
      console.log(`[SUCCESS] Updated ${email} with accessCode ${accessCode}`);
      
      credentialsOutput.push(`"${user.namaLengkap}","${user.namaJabatan}",${email},${accessCode},${user.password}`);
    } catch (e) {
      console.error(`[ERROR] Failed to update ${email}: ${e.message}`);
    }
  }

  const credentialsPath = 'd:/Project/GAWE/PresensiASN/STP_Credentials.csv';
  fs.writeFileSync(credentialsPath, credentialsOutput.join('\n'));
  console.log(`\n✅ Successfully synced! Credentials saved to STP_Credentials.csv`);
}

syncCodes().catch(console.error);
