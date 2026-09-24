// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { parse } from 'csv-parse/sync';

// Load service account (Ensure GOOGLE_APPLICATION_CREDENTIALS or path is set)
// Or just let admin proxy handle if we use the same config logic.
// In this scratch script, we will import the adminDb directly from our lib if it works in node context?
// Wait, `src/lib/firebase/admin.ts` expects env vars.
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

const auth = getAuth();
const db = getFirestore();
db.settings({ databaseId: "presensi-pegawai" }); // Hardcoded for this app context if named db

async function seedSTP() {
  const usersCsv = fs.readFileSync(path.resolve(__dirname, '../src/data/stp-users.csv'), 'utf8');
  const orgCsv = fs.readFileSync(path.resolve(__dirname, '../src/data/stp-org.csv'), 'utf8');

  const users = parse(usersCsv, { columns: true, skip_empty_lines: true });
  const orgs = parse(orgCsv, { columns: true, skip_empty_lines: true });

  // Create a map for fast lookup of Jabatan -> Level/Atasan
  const jabatanMap = new Map();
  for (const org of orgs) {
    jabatanMap.set(org.namaJabatan, org);
  }

  const generatedCredentials = [];
  let userCounter = 1;

  for (const user of users) {
    const accessCode = `STP-${userCounter.toString().padStart(3, '0')}`;
    userCounter++;

    let uid = '';
    try {
      // Create user in Auth
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.namaLengkap,
      });
      uid = userRecord.uid;
      console.log(`[AUTH] Created user: ${user.email} (${uid})`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail(user.email);
        uid = existing.uid;
        console.log(`[AUTH] User exists: ${user.email} (${uid}), updating password...`);
        await auth.updateUser(uid, { password: user.password });
      } else {
        console.error(`[AUTH] Failed to create ${user.email}:`, err.message);
        continue;
      }
    }

    // Get organizational structure for this position
    const orgInfo = jabatanMap.get(user.namaJabatan) || {};
    
    const profile = {
      id: uid,
      nip: user.nip,
      accessCode: accessCode,
      nama: user.namaLengkap,
      email: user.email,
      role: orgInfo.klasterStruktur === 'blud' && orgInfo.level <= 6 ? 'atasan' : (user.role === 'admin_opd' ? 'admin' : 'pegawai'),
      jabatan: user.namaJabatan,
      golongan: '-',
      instansi: 'UPTD Kawasan Sains dan Teknologi Solo Technopark',
      orgId: 'org-stp',
      departmentId: 'dept-stp',
      departmentName: orgInfo.namaOpd || 'UPTD KTS Solo Technopark',
      // We will link atasanId in a second pass or rely on searching by namaAtasan
      _namaAtasanTemp: orgInfo.namaAtasan,
      storageUsedBytes: 0,
      storageLimitBytes: 1073741824, // 1 GB
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection("users").doc(uid).set(profile, { merge: true });
    console.log(`[FIRESTORE] Saved profile for: ${profile.nama}`);

    generatedCredentials.push({
      Nama: profile.nama,
      Jabatan: profile.jabatan,
      Email: profile.email,
      AccessCode: accessCode,
      Password: user.password
    });
  }

  // Second pass: resolve Atasan IDs
  console.log("Resolving atasan IDs...");
  const allUsersSnap = await db.collection("users").where("orgId", "==", "org-stp").get();
  const allUsers = allUsersSnap.docs.map(d => d.data());

  for (const user of allUsers) {
    if (user._namaAtasanTemp) {
      // Find atasan by exact Jabatan match, since namaAtasan field contains the Jabatan name
      const atasan = allUsers.find(u => u.jabatan === user._namaAtasanTemp);
      if (atasan) {
        await db.collection("users").doc(user.id).update({
          atasanId: atasan.id,
          atasanNama: atasan.nama,
        });
        console.log(`[LINK] ${user.nama} -> Atasan: ${atasan.nama}`);
      }
    }
  }

  // Write credentials output
  const outputCsv = [
    "Nama,Jabatan,Email,AccessCode,Password",
    ...generatedCredentials.map(c => `"${c.Nama}","${c.Jabatan}",${c.Email},${c.AccessCode},${c.Password}`)
  ].join("\n");
  
  fs.writeFileSync(path.resolve(__dirname, '../STP_Credentials.csv'), outputCsv);
  console.log("\n✅ Seeding complete! Credentials saved to STP_Credentials.csv");
}

seedSTP().catch(console.error);
