import { getDevUsersStore, getDevUserProfile, addDevUser } from "../src/data/seedData.ts";

console.log("=== VERIFIKASI FITUR DATA PEGAWAI & USER CREATION ===");

// 1. Cek User Store Awal
const store = getDevUsersStore();
console.log(`\n1. Initial Users Count: ${store.size}`);
for (const u of store.values()) {
  console.log(`  • [${u.role.toUpperCase()}] ${u.nama} (NIP: ${u.nip}) - Kantor: ${u.namaKantor}`);
}

if (store.size >= 4) {
  console.log("  ✅ Master awal ASN terdaftar lengkap!");
} else {
  console.error("  ❌ Master awal ASN kurang!");
}

// 2. Simulasi Pendaftaran Pegawai Baru
console.log("\n2. Simulating New ASN Registration:");
const newAsn = {
  id: "asn_199305122019011003_test",
  nip: "19930512 201901 1 003",
  nama: "Rahmat Hidayat, S.STP, M.M.",
  email: "rahmat.hidayat@surakarta.go.id",
  role: "pegawai",
  jabatan: "Pranata Komputer Ahli Pertama",
  golongan: "III/a - Penata Muda",
  instansi: "Pemerintah Kota Surakarta - Solo Teknopark",
  orgId: "org-surakarta",
  departmentId: "dept-inovasi-stp",
  departmentName: "Subdivisi Rekayasa Perangkat Lunak & AI",
  kantorId: "kantor-stp",
  namaKantor: "Solo Teknopark",
  atasanId: "Uvo5KeY3pOcvdOYInpBcTJCDAb53",
  atasanNama: "Dra. Siti Rahmawati, M.Si.",
  nomorHp: "081234567899",
  storageUsedBytes: 0,
  storageLimitBytes: 1073741824,
  createdAt: new Date().toISOString(),
};

addDevUser(newAsn);
console.log(`  User baru didaftarkan: ${newAsn.nama}`);
console.log(`  Total users sekarang: ${store.size}`);

// 3. Verifikasi Resolusi Login Akun Baru
console.log("\n3. Testing Login Resolution for New ASN:");
const lookupByEmail = getDevUserProfile("rahmat.hidayat@surakarta.go.id");
const lookupByNip = getDevUserProfile("19930512 201901 1 003");
const lookupById = getDevUserProfile(newAsn.id);

if (lookupByEmail && lookupByNip && lookupById) {
  console.log(`  ✅ [Email Match] Found: ${lookupByEmail.nama}`);
  console.log(`  ✅ [NIP Match] Found: ${lookupByNip.nama}`);
  console.log(`  ✅ [ID Match] Found: ${lookupById.nama}`);
  console.log("  🎉 Akun baru ASN langsung dikenali oleh sistem autentikasi dan siap login!");
} else {
  console.error("  ❌ Gagal menemukan akun baru!");
}

console.log("\n=== SELURUH PENGUJIAN DATA PEGAWAI SELESAI ===");
