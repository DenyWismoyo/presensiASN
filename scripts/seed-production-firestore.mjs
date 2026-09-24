import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Baca .env.local untuk memuat kredensial
const envContent = fs.readFileSync(".env.local", "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    envVars[match[1].trim()] = val.replace(/\\n/g, "\n");
  }
}

const privateKey = envVars.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const projectId = envVars.FIREBASE_ADMIN_PROJECT_ID || "teknopark-surakarta";

console.log("=== SEEDING AKUN ASN KE FIREBASE AUTH & FIRESTORE ===");
console.log("Project:", projectId);
console.log("Client Email:", clientEmail);

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const adminAuth = getAuth(app);

// Data akun ASN yang akan dibuat/diperbarui
const ACCOUNTS = [
  {
    email: "admin.stp@surakarta.go.id",
    password: "asn123456",
    displayName: "Hendra Wijaya, S.STP, M.AP",
    nip: "19850101 201001 1 005",
    role: "admin",
    jabatan: "Kepala Bidang Pengadaan & Informasi Kepegawaian",
    golongan: "IV/a (Pembina)",
    kantorId: "kantor-bkpsdm",
    namaKantor: "BKPSDM Kota Surakarta",
    storageUsedBytes: 52428800,
  },
  {
    email: "siti.rahmawati@surakarta.go.id",
    password: "asn123456",
    displayName: "Dra. Siti Rahmawati, M.Si.",
    nip: "19780412 200502 2 001",
    role: "atasan",
    jabatan: "Kepala UPT Solo Teknopark",
    golongan: "IV/b (Pembina Tingkat I)",
    kantorId: "kantor-stp",
    namaKantor: "Solo Teknopark",
    storageUsedBytes: 125829120,
  },
  {
    email: "budi.santoso@surakarta.go.id",
    password: "asn123456",
    displayName: "Budi Santoso, S.Kom.",
    nip: "19920817 201801 1 002",
    role: "pegawai",
    jabatan: "Pranata Komputer Ahli Pertama",
    golongan: "III/a (Penata Muda)",
    kantorId: "kantor-stp",
    namaKantor: "Solo Teknopark",
    storageUsedBytes: 83886080,
  },
  {
    email: "rina.wulandari@surakarta.go.id",
    password: "asn123456",
    displayName: "Rina Wulandari, S.Kom.",
    nip: "19950415 202001 2 006",
    role: "pegawai",
    jabatan: "Analis Sistem Informasi",
    golongan: "III/a (Penata Muda)",
    kantorId: "kantor-stp",
    namaKantor: "Solo Teknopark",
    storageUsedBytes: 31457280,
  },
];

const KANTOR_LIST = [
  {
    id: "kantor-stp",
    nama: "Solo Teknopark (STP)",
    alamat: "Jl. Ki Hajar Dewantara No.19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126",
    latitude: -7.5583,
    longitude: 110.8574,
    radiusMeters: 150,
    isActive: true,
  },
  {
    id: "kantor-bkpsdm",
    nama: "Balaikota / BKPSDM Surakarta",
    alamat: "Jl. Jend. Sudirman No.2, Kedung Lumbu, Kec. Pasar Kliwon, Kota Surakarta, Jawa Tengah 57111",
    latitude: -7.5694,
    longitude: 110.8285,
    radiusMeters: 150,
    isActive: true,
  },
];

async function seed() {
  try {
    const userProfiles = [];

    // 1. Sinkronisasi Akun ke Firebase Authentication
    console.log("\n1. Sinkronisasi Akun ke Firebase Auth...");
    for (const acc of ACCOUNTS) {
      let uid;
      try {
        const existing = await adminAuth.getUserByEmail(acc.email);
        uid = existing.uid;
        // Update password & display name jika perlu
        await adminAuth.updateUser(uid, {
          password: acc.password,
          displayName: acc.displayName,
        });
        console.log(`  ✓ User ${acc.email} ditemukan (UID: ${uid})`);
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          const newUser = await adminAuth.createUser({
            email: acc.email,
            password: acc.password,
            displayName: acc.displayName,
          });
          uid = newUser.uid;
          console.log(`  + User ${acc.email} berhasil dibuat (UID: ${uid})`);
        } else {
          throw err;
        }
      }

      // Set Custom Claims role
      await adminAuth.setCustomUserClaims(uid, { role: acc.role });

      userProfiles.push({
        id: uid,
        nip: acc.nip,
        nama: acc.displayName,
        email: acc.email,
        role: acc.role,
        jabatan: acc.jabatan,
        golongan: acc.golongan,
        kantorId: acc.kantorId,
        namaKantor: acc.namaKantor,
        storageUsedBytes: acc.storageUsedBytes,
        storageLimitBytes: 1073741824, // 1 GB
        createdAt: new Date().toISOString(),
      });
    }

    // Set atasanId untuk bawahan
    const sitiProfile = userProfiles.find((u) => u.role === "atasan");
    if (sitiProfile) {
      for (const u of userProfiles) {
        if (u.role === "pegawai") {
          u.atasanId = sitiProfile.id;
          u.namaAtasan = sitiProfile.nama;
        }
      }
    }

    // 2. Tulis data ke Firestore (kedua database: presensi-pegawai dan (default))
    const databases = ["presensi-pegawai", "(default)"];

    for (const dbName of databases) {
      console.log(`\n2. Menulis Dokumen ke Firestore Database [${dbName}]...`);
      const db = dbName === "(default)" ? getFirestore(app) : getFirestore(app, dbName);

      // A. Simpan Kantor
      console.log(`  • Menyimpan master kantor...`);
      for (const k of KANTOR_LIST) {
        await db.collection("kantor").doc(k.id).set(k, { merge: true });
        console.log(`    ✓ Kantor: ${k.nama} (${k.id})`);
      }

      // B. Simpan User Profiles
      console.log(`  • Menyimpan profil ASN users/{uid}...`);
      for (const p of userProfiles) {
        await db.collection("users").doc(p.id).set(p, { merge: true });
        console.log(`    ✓ User doc: [${p.role.toUpperCase()}] ${p.nama} (NIP: ${p.nip}) -> users/${p.id}`);
      }

      // C. Simpan Sample LKH bawahan yang siap dinilai (agar badge atasan aktif)
      console.log(`  • Menyimpan sample LKH submitted untuk review atasan...`);
      const sampleLkh = [
        {
          id: "lkh-seed-budi-01",
          userId: userProfiles.find((u) => u.email === "budi.santoso@surakarta.go.id")?.id,
          tanggal: new Date().toISOString().split("T")[0],
          status: "submitted",
          submittedAt: new Date().toISOString(),
          totalPoinHarian: 320,
          totalDurasiMenit: 390,
          aktivitas: [
            {
              id: "akt-1",
              jamMulai: "08:00",
              jamSelesai: "11:30",
              durasiMenit: 210,
              masterAktivitasId: "akt-it-1",
              deskripsiAktivitas: "Pemeliharaan rutin server presensi dan pengecekan geofencing GPS",
              outputKegiatan: "Laporan monitoring server presensi",
              poinSkp: 180,
            },
            {
              id: "akt-2",
              jamMulai: "13:00",
              jamSelesai: "16:00",
              durasiMenit: 180,
              masterAktivitasId: "akt-it-2",
              deskripsiAktivitas: "Pengembangan modul rekapitulasi data kehadiran ASN",
              outputKegiatan: "Fitur rekapitulasi dan filter tanggal",
              poinSkp: 140,
            },
          ],
        },
      ];

      for (const lkh of sampleLkh) {
        if (lkh.userId) {
          await db.collection("lkh").doc(lkh.id).set(lkh, { merge: true });
          console.log(`    ✓ LKH doc: ${lkh.id} (status: submitted)`);
        }
      }
    }

    console.log("\n🎉 BERHASIL! Seluruh akun dan data master telah masuk ke Firebase Production!");
    console.log("Akun-akun berikut sekarang dapat langsung login di https://presensiasn.vercel.app/ maupun lokal:");
    for (const u of userProfiles) {
      console.log(`  • [${u.role.toUpperCase()}] ${u.nama} (${u.email}) - NIP: ${u.nip}`);
    }
  } catch (err) {
    console.error("\n❌ Gagal seeding:", err);
  }
}

seed();
