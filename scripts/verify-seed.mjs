import { SEED_USERS, getDevUserProfile, generateSeedPresensiHistory, SEED_PENDING_LKH_LIST, getDevPresensiStore, getDevLKHStore } from "../src/data/seedData.ts";

console.log("=== VERIFIKASI SEED DATA DEVELOPER ===");

// 1. Verifikasi User Profile Resolution
console.log("\n1. Testing Profile Lookup:");
const testCases = [
  { label: "UID Pegawai", input: "DrwAiaKokNhjjlbaQjnuuJ8Al4m1", expectedRole: "pegawai" },
  { label: "Email Pegawai", input: "budi.santoso@surakarta.go.id", expectedRole: "pegawai" },
  { label: "NIP Pegawai", input: "19920817 201801 1 002", expectedRole: "pegawai" },
  { label: "UID Atasan", input: "Uvo5KeY3pOcvdOYInpBcTJCDAb53", expectedRole: "atasan" },
  { label: "Email Atasan", input: "siti.rahmawati@surakarta.go.id", expectedRole: "atasan" },
  { label: "UID Admin", input: "Ze6odkY0boPjgC5jfWVPph3jfPF3", expectedRole: "admin" },
  { label: "Email Admin", input: "admin.stp@surakarta.go.id", expectedRole: "admin" },
  { label: "Legacy User ID", input: "user-asn-001", expectedRole: "pegawai" },
];

let allPassed = true;
for (const tc of testCases) {
  const user = getDevUserProfile(tc.input);
  if (user && user.role === tc.expectedRole) {
    console.log(`  ✅ [${tc.label}] Found ${user.nama} (${user.role})`);
  } else {
    console.error(`  ❌ [${tc.label}] FAILED for ${tc.input}`);
    allPassed = false;
  }
}

// 2. Verifikasi 30 Hari Presensi
console.log("\n2. Testing 30-Day Presensi History:");
const presensiStore = getDevPresensiStore();
console.log(`  Total presensi records in store: ${presensiStore.size}`);
const presensiList = Array.from(presensiStore.values());
const hadirCount = presensiList.filter(p => p.status === "hadir").length;
const terlambatCount = presensiList.filter(p => p.status === "terlambat").length;
const izinCount = presensiList.filter(p => ["izin", "cuti"].includes(p.status)).length;
console.log(`  - Hadir: ${hadirCount}`);
console.log(`  - Terlambat: ${terlambatCount}`);
console.log(`  - Izin / Cuti: ${izinCount}`);

if (presensiList.length >= 20 && hadirCount > 15) {
  console.log("  ✅ Presensi records populated accurately!");
} else {
  console.error("  ❌ Presensi records insufficient!");
  allPassed = false;
}

// 3. Verifikasi Pending LKH List
console.log("\n3. Testing Pending LKH Records:");
const lkhStore = getDevLKHStore();
console.log(`  Total LKH records in store: ${lkhStore.size}`);
const pendingLkh = Array.from(lkhStore.values()).filter(l => l.status === "submitted");
console.log(`  - Pending for Atasan approval: ${pendingLkh.length}`);
for (const lkh of pendingLkh) {
  console.log(`    • ${lkh.nama}: ${lkh.totalPoinHarian} poin (target 300: ${lkh.isTargetTercapai ? 'TERCAPAI' : 'BELUM'})`);
}

if (pendingLkh.length === 2 && pendingLkh.every(l => l.totalPoinHarian >= 300)) {
  console.log("  ✅ Pending LKH valid for individual & batch approval!");
} else {
  console.error("  ❌ Pending LKH invalid!");
  allPassed = false;
}

console.log("\n" + (allPassed ? "🎉 ALL SEED VERIFICATION CHECKS PASSED!" : "⚠️ SOME CHECKS FAILED"));
