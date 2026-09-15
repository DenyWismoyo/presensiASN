/**
 * Master Data: Kamus 152 Aktivitas Harian ASN Pemerintah Kota Surakarta
 * Dasar Hukum: Keputusan Walikota Surakarta Nomor 786/154 Tahun 2020
 * Digunakan untuk integrasi sistem e-Kinerja BKPSDM Kota Surakarta
 */

export interface AktivitasSolo {
  id: number;
  nama: string;
  satuan: string;
  nilaiPoin: number;
  keterangan?: string;
  kategori?: 'Persuratan' | 'Manajerial' | 'Pelayanan' | 'Kesehatan' | 'Hukum' | 'Keuangan' | 'Teknis' | 'Umum';
}

export const MASTER_AKTIVITAS_SOLO: AktivitasSolo[] = [
  { id: 1, nama: "Melaksanakan desinfeksi", satuan: "Per kegiatan", nilaiPoin: 95, keterangan: "meliputi kegiatan pembasmian hama/penyakit", kategori: "Teknis" },
  { id: 2, nama: "Melaksanakan tugas jaga", satuan: "Per jam", nilaiPoin: 39, keterangan: "meliputi kegiatan melaksanakan tugas piket", kategori: "Umum" },
  { id: 3, nama: "Melakukan konsultasi", satuan: "Per jam", nilaiPoin: 60, kategori: "Manajerial" },
  { id: 4, nama: "Melakukan koordinasi (Dalam Daerah)", satuan: "Per kegiatan", nilaiPoin: 60, keterangan: "meliputi kegiatan menyelaraskan, menyeimbangkan, mensinkronkan kegiatan kerja dari satu pihak dengan pihak yang lain dalam wilayah Kota Surakarta", kategori: "Manajerial" },
  { id: 5, nama: "Melakukan koordinasi (Luar Daerah)", satuan: "Per kegiatan", nilaiPoin: 90, keterangan: "meliputi kegiatan menyelaraskan, menyeimbangkan, mensinkronkan kegiatan kerja dari satu pihak dengan pihak yang lain di luar wilayah Kota Surakarta", kategori: "Manajerial" },
  { id: 6, nama: "Melakukan koordinasi melalui media elektronik", satuan: "Per kegiatan", nilaiPoin: 20, keterangan: "meliputi kegiatan menyelaraskan, menyeimbangkan, mensinkronkan kegiatan kerja dari satu pihak dangan pihak yang lain melalui media elektronik", kategori: "Manajerial" },
  { id: 7, nama: "Melakukan latihan", satuan: "Per latihan", nilaiPoin: 63, keterangan: "meliputi kegiatan persiapan upacara, lomba, pementasan dan event lain sejenis", kategori: "Umum" },
  { id: 8, nama: "Melakukan negosiasi", satuan: "Per kegiatan", nilaiPoin: 90, keterangan: "meliputi kegiatan proses tawar menawar untuk mencapai kesepakatan bersama dengan jalan berunding", kategori: "Manajerial" },
  { id: 9, nama: "Melakukan otopsi", satuan: "Per jam", nilaiPoin: 125, kategori: "Kesehatan" },
  { id: 10, nama: "Melakukan pelayanan kesehatan", satuan: "Per 10 pasien", nilaiPoin: 60, keterangan: "meliputi kegiatan melakukan visum et repertum, menguji kesehatan, memeriksa pasien, melakukan pelacakan kesehatan, pelayanan medik umum, spesialis, konseling, imunisasi, gizi, anamnesa, menegakkan diagnosa", kategori: "Kesehatan" },
  { id: 11, nama: "Melakukan pembibitan", satuan: "Per kegiatan", nilaiPoin: 56, keterangan: "Meliputi kegiatan penyemaian dan pengembangan bibit untuk ditanam atau diternakkan", kategori: "Teknis" },
  { id: 12, nama: "Melakukan pemeliharaan", satuan: "Per objek/per kegiatan", nilaiPoin: 55, keterangan: "Meliputi kegiatan pemeliharaan tanaman, kendaraan dinas dll kegiatan sejenis", kategori: "Teknis" },
  { id: 13, nama: "Melakukan pementasan", satuan: "Per pementasan", nilaiPoin: 156, kategori: "Umum" },
  { id: 14, nama: "Melakukan penelitian", satuan: "per kegiatan", nilaiPoin: 105, keterangan: "meliputi kegiatan pengumpulan, pengolahan, analisis, dan penyajian data yang dilakukan secara sistematis dan objektif", kategori: "Teknis" },
  { id: 15, nama: "Melakukan penjurian", satuan: "Per aktivitas", nilaiPoin: 100, keterangan: "meliputi kegiatan menilai dan memutuskan (dalam perlombaan, pertandingan, dan sebagainya)", kategori: "Umum" },
  { id: 16, nama: "Melakukan penyuluhan", satuan: "Per jam", nilaiPoin: 72, kategori: "Pelayanan" },
  { id: 17, nama: "Melakukan perempelan/penebangan pohon", satuan: "Per jam", nilaiPoin: 55, kategori: "Teknis" },
  { id: 18, nama: "Melakukan sinkronisasi dan harmonisasi Produk Hukum (Perda)", satuan: "Per kegiatan", nilaiPoin: 156, kategori: "Hukum" },
  { id: 19, nama: "Melakukan sinkronisasi dan harmonisasi Produk Hukum (Perwali)", satuan: "Per kegiatan", nilaiPoin: 115, kategori: "Hukum" },
  { id: 20, nama: "Melakukan tindakan pelayanan kesehatan", satuan: "Per 10 pasien", nilaiPoin: 90, keterangan: "meliputi kegiatan menolong persalinan, pelayanan KB, tindakan cabut gigi, tumpatan, pembersihan karang gigi, kegawatdaruratan", kategori: "Kesehatan" },
  { id: 21, nama: "Melakukan tindakan pelayanan kesehatan hewan", satuan: "Per objek", nilaiPoin: 57, kategori: "Kesehatan" },
  { id: 22, nama: "Melakukan tugas karawitan", satuan: "Per pementasan", nilaiPoin: 156, kategori: "Umum" },
  { id: 23, nama: "Melaminasi", satuan: "Per kegiatan", nilaiPoin: 39, keterangan: "meliputi kegiatan melapisi sesuatu dengan bahan pelindung tipis", kategori: "Teknis" },
  { id: 24, nama: "Melatih", satuan: "Per jam", nilaiPoin: 72, keterangan: "meliputi kegiatan mengajar seseorang dan sebagainya agar terbiasa/mampu melakukan sesuatu", kategori: "Umum" },
  { id: 25, nama: "Melayani", satuan: "Per kegiatan", nilaiPoin: 48, keterangan: "meliputi kegiatan membantu menyiapkan/mengurus layanan birokrasi", kategori: "Pelayanan" },
  { id: 26, nama: "Melelang", satuan: "Per kegiatan", nilaiPoin: 90, kategori: "Keuangan" },
  { id: 27, nama: "Meliput", satuan: "Per kegiatan", nilaiPoin: 51, keterangan: "membuat berita atau laporan secara terperinci tentang suatu masalah atau peristiwa", kategori: "Umum" },
  { id: 28, nama: "Memandu", satuan: "Per kegiatan", nilaiPoin: 65, keterangan: "meliputi kegiatan menunjukkan, menjelaskan suatu kondisi di Kota Surakarta kepada tamu, media, wisatawan", kategori: "Pelayanan" },
  { id: 29, nama: "Memanen benih", satuan: "per kegiatan", nilaiPoin: 56, kategori: "Teknis" },
  { id: 30, nama: "Memaparkan", satuan: "Per jam", nilaiPoin: 96, keterangan: "meliputi kegiatan memberikan penjelasan secara rinci dan sistematis", kategori: "Manajerial" },
  { id: 31, nama: "Memasang", satuan: "Per kegiatan", nilaiPoin: 51, kategori: "Teknis" },
  { id: 32, nama: "Memasukkan data", satuan: "per dokumen/berkas", nilaiPoin: 35, keterangan: "meliputi kegiatan memasukkan data ke dalam data elektronik", kategori: "Teknis" },
  { id: 33, nama: "Membayarkan", satuan: "Per kegiatan", nilaiPoin: 42, kategori: "Keuangan" },
  { id: 34, nama: "Memberi arahan", satuan: "Per kegiatan", nilaiPoin: 51, keterangan: "meliputi kegiatan memberikan petunjuk atau perintah terkait pekerjaan", kategori: "Manajerial" },
  { id: 35, nama: "Memberikan sambutan", satuan: "Per kegiatan", nilaiPoin: 90, kategori: "Manajerial" },
  { id: 36, nama: "Membersihkan", satuan: "Per kegiatan", nilaiPoin: 42, keterangan: "meliputi kegiatan mencuci, menggosok dan kegiatan lain sejenis sesuai tugas jabatan", kategori: "Umum" },
  { id: 37, nama: "Membimbing", satuan: "Per kegiatan", nilaiPoin: 64, keterangan: "meliputi kegiatan memberikan petunjuk atau penjelasan terkait keilmuan", kategori: "Manajerial" },
  { id: 38, nama: "Membina", satuan: "Per kegiatan", nilaiPoin: 76, keterangan: "meliputi upaya mengubah atau mengupayakan perilaku/kinerja menjadi lebih baik", kategori: "Manajerial" },
  { id: 39, nama: "Membuat katalog", satuan: "Per kegiatan/Per katalog", nilaiPoin: 72, kategori: "Teknis" },
  { id: 40, nama: "Membuat kliping", satuan: "Per kliping", nilaiPoin: 40, kategori: "Umum" },
  { id: 41, nama: "Membuat laporan", satuan: "Per kegiatan", nilaiPoin: 64, keterangan: "meliputi kegiatan menyusun hasil rapat/ kegiatan/ pekerjaan dalam bentuk dokumen", kategori: "Persuratan" },
  { id: 42, nama: "Membuat rancangan gambar", satuan: "Per jam", nilaiPoin: 80, kategori: "Teknis" },
  { id: 43, nama: "Membuat tabulasi", satuan: "Per kegiatan", nilaiPoin: 60, kategori: "Teknis" },
  { id: 44, nama: "Memediasi", satuan: "Per pertemuan", nilaiPoin: 96, keterangan: "meliputi kegiatan proses pengikutsertaan pihak ketiga dalam penyelesaian suatu perselisihan sebagai penasihat", kategori: "Hukum" },
  { id: 45, nama: "Memeriksa", satuan: "Per kegiatan", nilaiPoin: 63, keterangan: "meliputi kegiatan melihat dengan teliti untuk mengetahui keabsahan, kesalahan, menyelidiki (perkara)", kategori: "Manajerial" },
  { id: 46, nama: "Memfasilitasi", satuan: "Per kegiatan", nilaiPoin: 60, kategori: "Pelayanan" },
  { id: 47, nama: "Memfotocopy", satuan: "Per kegiatan", nilaiPoin: 24, kategori: "Umum" },
  { id: 48, nama: "Memimpin kunjungan kerja", satuan: "per kegiatan/obyek", nilaiPoin: 104, kategori: "Manajerial" },
  { id: 49, nama: "Memimpin rapat", satuan: "Per rapat/kegiatan", nilaiPoin: 100, kategori: "Manajerial" },
  { id: 50, nama: "Memindahkan", satuan: "per kegiatan", nilaiPoin: 48, keterangan: "Meliputi kegiatan menempatkan ke tempat lain sarana prasarana/ peralatan terkait pekerjaan", kategori: "Teknis" },
  { id: 51, nama: "Memindai", satuan: "per kegiatan", nilaiPoin: 30, keterangan: "Meliputi kegiatan mengcopy (scan) gambar atau teks pada media elektronik dalam bentuk digital", kategori: "Teknis" },
  { id: 52, nama: "Memonitor", satuan: "Per kegiatan", nilaiPoin: 70, keterangan: "meliputi kegiatan mengawasi, mengamati, mengecek, mengatur atau mengontrol", kategori: "Manajerial" },
  { id: 53, nama: "Memparaf Keputusan/Peraturan", satuan: "Per keputusan/peraturan", nilaiPoin: 65, kategori: "Hukum" },
  { id: 54, nama: "Memparaf RKA/DPA/ Renja/ SPJ", satuan: "Per 10 dokumen", nilaiPoin: 50, kategori: "Keuangan" },
  { id: 55, nama: "Memparaf Surat/Nota Dinas/Berita Acara", satuan: "Per 10 dokumen", nilaiPoin: 32, kategori: "Persuratan" },
  { id: 56, nama: "Mempelajari", satuan: "Per kegiatan", nilaiPoin: 60, keterangan: "meliputi kegiatan menelaah, mendalami suatu hal terkait pekerjaan", kategori: "Manajerial" },
  { id: 57, nama: "Memperbaharui", satuan: "Per kegiatan", nilaiPoin: 40, kategori: "Teknis" },
  { id: 58, nama: "Memperbaiki", satuan: "Per objek", nilaiPoin: 48, keterangan: "meliputi kegiatan memperbaiki dokumen atau sarana", kategori: "Teknis" },
  { id: 59, nama: "Memperforasi", satuan: "Per kegiatan", nilaiPoin: 42, kategori: "Teknis" },
  { id: 60, nama: "Memproses", satuan: "Per 10 dokumen", nilaiPoin: 56, keterangan: "Meliputi kegiatan rangkaian tindakan, pembuatan, atau pengolahan yang menghasilkan output pekerjaan", kategori: "Persuratan" },
  { id: 61, nama: "Mempublikasikan", satuan: "Per kegiatan", nilaiPoin: 50, keterangan: "meliputi kegiatan mengumumkan, menerbitkan, menyiarkan (buku, majalah, berita)", kategori: "Umum" },
  { id: 62, nama: "Memungut retribusi", satuan: "Per jam", nilaiPoin: 50, kategori: "Keuangan" },
  { id: 63, nama: "Memusnahkan", satuan: "Per kegiatan", nilaiPoin: 45, keterangan: "Meliputi kegiatan melenyapkan atau menghapus data/dokumen/barang", kategori: "Teknis" },
  { id: 64, nama: "Memvaksinasi hewan", satuan: "per objek", nilaiPoin: 56, kategori: "Kesehatan" },
  { id: 65, nama: "Memvalidasi", satuan: "Per 10 berkas", nilaiPoin: 63, kategori: "Manajerial" },
  { id: 66, nama: "Memverifikasi", satuan: "Per 10 berkas", nilaiPoin: 60, kategori: "Manajerial" },
  { id: 67, nama: "Menandatangani Keputusan/Peraturan", satuan: "Per keputusan/peraturan", nilaiPoin: 100, kategori: "Hukum" },
  { id: 68, nama: "Menandatangani RKA/DPA/Renja/SPJ", satuan: "Per 10 dokumen", nilaiPoin: 70, kategori: "Keuangan" },
  { id: 69, nama: "Menandatangani Surat/Nota Dinas/Berita Acara", satuan: "Per 10 dokumen", nilaiPoin: 40, kategori: "Persuratan" },
  { id: 70, nama: "Menata", satuan: "Per kegiatan", nilaiPoin: 44, kategori: "Umum" },
  { id: 71, nama: "Mencari", satuan: "Per kegiatan", nilaiPoin: 30, keterangan: "meliputi kegiatan upaya menemukan sesuatu yang berhubungan dengan pekerjaan", kategori: "Umum" },
  { id: 72, nama: "Mencatat", satuan: "per kegiatan", nilaiPoin: 20, kategori: "Persuratan" },
  { id: 73, nama: "Mencetak", satuan: "Per kegiatan", nilaiPoin: 52, kategori: "Teknis" },
  { id: 74, nama: "Mencocokkan", satuan: "per kegiatan", nilaiPoin: 24, keterangan: "Meliputi kegiatan membandingkan untuk mengetahui benar tidaknya suatu hal terkait pekerjaan", kategori: "Manajerial" },
  { id: 75, nama: "Mencuci", satuan: "Per kegiatan", nilaiPoin: 42, kategori: "Umum" },
  { id: 76, nama: "Mendampingi", satuan: "Per lokasi/kegiatan", nilaiPoin: 55, kategori: "Pelayanan" },
  { id: 77, nama: "Mendesain", satuan: "Per kegiatan/objek", nilaiPoin: 85, kategori: "Teknis" },
  { id: 78, nama: "Mendiskusikan", satuan: "Per permasalahan", nilaiPoin: 60, keterangan: "meliputi kegiatan membicarakan sesuatu dengan pihak lain mengenai masalah pekerjaan", kategori: "Manajerial" },
  { id: 79, nama: "Mendisposisi", satuan: "Per 10 surat", nilaiPoin: 30, keterangan: "mendisposisikan naskah dinas/surat masuk ke bawahan", kategori: "Persuratan" },
  { id: 80, nama: "Mendistribusikan", satuan: "Per lokasi/kegiatan", nilaiPoin: 40, kategori: "Persuratan" },
  { id: 81, nama: "Mendokumentasikan", satuan: "Per kegiatan", nilaiPoin: 50, kategori: "Teknis" },
  { id: 82, nama: "Menera ulang", satuan: "Per objek", nilaiPoin: 63, kategori: "Teknis" },
  { id: 83, nama: "Menerima", satuan: "Per kegiatan", nilaiPoin: 13, kategori: "Pelayanan" },
  { id: 84, nama: "Menerima konsultasi", satuan: "Per konsultasi", nilaiPoin: 63, kategori: "Pelayanan" },
  { id: 85, nama: "Menerima pengaduan", satuan: "Per permasalahan", nilaiPoin: 52, kategori: "Pelayanan" },
  { id: 86, nama: "Menerjemahkan bahasa", satuan: "Per kunjungan/objek/kegiatan", nilaiPoin: 96, kategori: "Umum" },
  { id: 87, nama: "Menertibkan", satuan: "Per kegiatan/lokasi", nilaiPoin: 100, kategori: "Teknis" },
  { id: 88, nama: "Menetapkan pemenang", satuan: "Per objek", nilaiPoin: 95, kategori: "Keuangan" },
  { id: 89, nama: "Mengagenda", satuan: "Per 10 surat", nilaiPoin: 21, keterangan: "mencatat dan mengagendakan surat masuk atau surat keluar", kategori: "Persuratan" },
  { id: 90, nama: "Mengamankan", satuan: "Per kegiatan", nilaiPoin: 68, kategori: "Teknis" },
  { id: 91, nama: "Mengambil", satuan: "per kegiatan", nilaiPoin: 33, kategori: "Umum" },
  { id: 92, nama: "Menganalisis/Mengkaji/Menelaah Dokumen Lain", satuan: "Per bidang/permasalahan", nilaiPoin: 105, keterangan: "telaahan staf, kajian teknis, tindak lanjut disposisi surat", kategori: "Manajerial" },
  { id: 93, nama: "Menganalisis/Mengkaji/Menelaah Produk Hukum", satuan: "Per produk hukum", nilaiPoin: 156, keterangan: "analisis Perda, Perwali, Kepwal, Surat Edaran", kategori: "Hukum" },
  { id: 94, nama: "Mengarsipkan", satuan: "Per berkas", nilaiPoin: 42, keterangan: "menyimpan dan menata berkas arsip dinas", kategori: "Persuratan" },
  { id: 95, nama: "Mengatur", satuan: "Per kegiatan", nilaiPoin: 51, kategori: "Manajerial" },
  { id: 96, nama: "Mengaudit", satuan: "Per jam", nilaiPoin: 76, kategori: "Keuangan" },
  { id: 97, nama: "Mengawal", satuan: "Per kegiatan", nilaiPoin: 57, kategori: "Umum" },
  { id: 98, nama: "Mengelola", satuan: "per kegiatan", nilaiPoin: 56, kategori: "Manajerial" },
  { id: 99, nama: "Mengelompokkan", satuan: "Per kegiatan", nilaiPoin: 48, kategori: "Teknis" },
  { id: 100, nama: "Mengembangbiakkan", satuan: "per kegiatan", nilaiPoin: 56, kategori: "Teknis" },
  { id: 101, nama: "Mengemudi", satuan: "Per jam", nilaiPoin: 68, kategori: "Umum" },
  { id: 102, nama: "Mengendalikan", satuan: "per kegiatan", nilaiPoin: 76, kategori: "Manajerial" },
  { id: 103, nama: "Mengetik", satuan: "per surat/perdokumen", nilaiPoin: 45, kategori: "Persuratan" },
  { id: 104, nama: "Mengevakuasi", satuan: "per jam", nilaiPoin: 90, kategori: "Teknis" },
  { id: 105, nama: "Mengevaluasi", satuan: "Per kegiatan", nilaiPoin: 75, kategori: "Manajerial" },
  { id: 106, nama: "Menggeledah", satuan: "Per kegiatan", nilaiPoin: 70, kategori: "Hukum" },
  { id: 107, nama: "Menghadiri acara", satuan: "Per acara/kegiatan", nilaiPoin: 55, kategori: "Umum" },
  { id: 108, nama: "Menghitung", satuan: "Per kegiatan", nilaiPoin: 60, kategori: "Keuangan" },
  { id: 109, nama: "Mengikuti Diklat/ Seminar/ Workshop/ Sosialisasi/Bimtek", satuan: "Per jam", nilaiPoin: 60, kategori: "Umum" },
  { id: 110, nama: "Mengikuti kunjungan kerja", satuan: "Per kegiatan/obyek", nilaiPoin: 90, kategori: "Manajerial" },
  { id: 111, nama: "Mengikuti rapat (Dalam Daerah)", satuan: "Per rapat/kegiatan", nilaiPoin: 75, kategori: "Manajerial" },
  { id: 112, nama: "Mengikuti rapat (Luar Daerah)", satuan: "Per rapat/kegiatan", nilaiPoin: 90, kategori: "Manajerial" },
  { id: 113, nama: "Mengikuti tes /seleksi", satuan: "Per jam", nilaiPoin: 60, kategori: "Umum" },
  { id: 114, nama: "Mengikuti upacara", satuan: "Per kegiatan", nilaiPoin: 70, kategori: "Umum" },
  { id: 115, nama: "Menginformasikan", satuan: "Per kegiatan", nilaiPoin: 18, kategori: "Pelayanan" },
  { id: 116, nama: "Menginstal", satuan: "Per program", nilaiPoin: 76, kategori: "Teknis" },
  { id: 117, nama: "Menginventaris", satuan: "Per kegiatan", nilaiPoin: 45, kategori: "Teknis" },
  { id: 118, nama: "Mengirim", satuan: "Per lokasi", nilaiPoin: 33, kategori: "Persuratan" },
  { id: 119, nama: "Mengklarifikasi", satuan: "Per permasalahan", nilaiPoin: 49, kategori: "Manajerial" },
  { id: 120, nama: "Mengkompilasi", satuan: "Per kegiatan", nilaiPoin: 84, kategori: "Teknis" },
  { id: 121, nama: "Mengolah data", satuan: "Per kegiatan", nilaiPoin: 60, kategori: "Teknis" },
  { id: 122, nama: "Mengonsep Keputusan/Perjanjian /MOU", satuan: "Per bidang/permasalahan", nilaiPoin: 114, kategori: "Hukum" },
  { id: 123, nama: "Mengonsep Surat/Dokumen", satuan: "Per surat/dokumen", nilaiPoin: 65, keterangan: "menyusun draf naskah dinas, nota dinas, surat keluar", kategori: "Persuratan" },
  { id: 124, nama: "Mengoperasikan", satuan: "Per kegiatan/objek kerja", nilaiPoin: 95, keterangan: "meliputi kegiatan mengoperasikan alat berat, peralatan elektronik dll", kategori: "Teknis" },
  { id: 125, nama: "Mengoreksi Keputusan Walikota/Keputusan Sekretaris Daerah/Perjanjian/MoU", satuan: "Per keputusan/MOU /Perjanjian", nilaiPoin: 105, kategori: "Hukum" },
  { id: 126, nama: "Mengoreksi Produk Hukum (Perda)", satuan: "Per produk hukum (Perda)", nilaiPoin: 144, kategori: "Hukum" },
  { id: 127, nama: "Mengoreksi Produk Hukum (Perwali)", satuan: "Per produk hukum (Perwali)", nilaiPoin: 115, kategori: "Hukum" },
  { id: 128, nama: "Mengoreksi Keputusan/Surat/Dokumen/Data", satuan: "Per keputusan/berkas/data", nilaiPoin: 63, keterangan: "memeriksa draf surat keluar, bahan laporan, atau data", kategori: "Persuratan" },
  { id: 129, nama: "Menguji", satuan: "Per 10 objek", nilaiPoin: 65, kategori: "Teknis" },
  { id: 130, nama: "Mengukur", satuan: "per lokasi", nilaiPoin: 51, kategori: "Teknis" },
  { id: 131, nama: "Mengumpulkan", satuan: "Per kegiatan/data", nilaiPoin: 40, kategori: "Teknis" },
  { id: 132, nama: "Menjadi Kuasa Hukum", satuan: "Per kegiatan", nilaiPoin: 176, kategori: "Hukum" },
  { id: 133, nama: "Menjadi saksi", satuan: "Per kegiatan/aktivitas", nilaiPoin: 96, kategori: "Hukum" },
  { id: 134, nama: "Menjawab sanggah", satuan: "Per kegiatan", nilaiPoin: 76, kategori: "Hukum" },
  { id: 135, nama: "Mensosialisasikan", satuan: "Per kegiatan", nilaiPoin: 56, kategori: "Pelayanan" },
  { id: 136, nama: "Mensurvey", satuan: "Per kegiatan/lokasi", nilaiPoin: 60, kategori: "Teknis" },
  { id: 137, nama: "Menyajikan data/laporan", satuan: "Per data/ laporan", nilaiPoin: 45, kategori: "Persuratan" },
  { id: 138, nama: "Menyapu", satuan: "Per jam", nilaiPoin: 48, kategori: "Umum" },
  { id: 139, nama: "Menyelenggarakan", satuan: "Per kegiatan", nilaiPoin: 105, kategori: "Manajerial" },
  { id: 140, nama: "Menyelenggarakan Diklat/Seminar/ Workshop/Sosialisasi/Bimtek", satuan: "Per jam", nilaiPoin: 68, kategori: "Manajerial" },
  { id: 141, nama: "Menyetorkan pajak atau retribusi", satuan: "Per kegiatan", nilaiPoin: 42, kategori: "Keuangan" },
  { id: 142, nama: "Menyiapkan Dokumen/Laporan/Bahan kerja", satuan: "Per dok/laporan/ bahan kerja", nilaiPoin: 56, kategori: "Persuratan" },
  { id: 143, nama: "Menyidik", satuan: "Per kegiatan", nilaiPoin: 99, kategori: "Hukum" },
  { id: 144, nama: "Menyimpan", satuan: "per data/barang", nilaiPoin: 35, kategori: "Teknis" },
  { id: 145, nama: "Menyusun konsepsi Produk Hukum (Perda)", satuan: "Per kegiatan", nilaiPoin: 198, kategori: "Hukum" },
  { id: 146, nama: "Menyusun konsepsi Produk Hukum (Perwali)", satuan: "Per kegiatan", nilaiPoin: 176, kategori: "Hukum" },
  { id: 147, nama: "Menyusun Pidato/Sambutan", satuan: "Per naskah/sambutan", nilaiPoin: 75, kategori: "Manajerial" },
  { id: 148, nama: "Menyusun Produk Hukum (Perda)", satuan: "Per kegiatan", nilaiPoin: 198, kategori: "Hukum" },
  { id: 149, nama: "Menyusun Produk Hukum (Perwali)", satuan: "Per kegiatan", nilaiPoin: 176, kategori: "Hukum" },
  { id: 150, nama: "Merekapitulasi", satuan: "Per laporan", nilaiPoin: 52, keterangan: "menyusun rekapitulasi data harian/bulanan", kategori: "Persuratan" },
  { id: 151, nama: "Merencanakan", satuan: "Per kegiatan", nilaiPoin: 68, kategori: "Manajerial" },
  { id: 152, nama: "Mewawancarai", satuan: "Per permasalahan", nilaiPoin: 51, kategori: "Umum" },
];

/**
 * Cari aktivitas berdasarkan kata kunci (nama, keterangan, atau kategori)
 */
export function searchAktivitasSolo(query: string): AktivitasSolo[] {
  if (!query || !query.trim()) return MASTER_AKTIVITAS_SOLO;
  const q = query.toLowerCase().trim();
  return MASTER_AKTIVITAS_SOLO.filter(item =>
    item.nama.toLowerCase().includes(q) ||
    (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
    (item.kategori && item.kategori.toLowerCase().includes(q))
  );
}

/**
 * Dapatkan aktivitas berdasarkan ID (1 - 152)
 */
export function getAktivitasSoloById(id: number): AktivitasSolo | undefined {
  return MASTER_AKTIVITAS_SOLO.find(item => item.id === id);
}

/**
 * Aktivitas yang paling sering digunakan dalam pekerjaan kantor & persuratan
 */
export const TOP_AKTIVITAS_PERSURATAN = [
  79,  // Mendisposisi (30)
  89,  // Mengagenda (21)
  123, // Mengonsep Surat/Dokumen (65)
  128, // Mengoreksi Keputusan/Surat/Dokumen/Data (63)
  55,  // Memparaf Surat/Nota Dinas/Berita Acara (32)
  69,  // Menandatangani Surat/Nota Dinas/Berita Acara (40)
  94,  // Mengarsipkan (42)
  92,  // Menganalisis/Mengkaji/Menelaah Dokumen Lain (105)
  56,  // Mempelajari (60)
  142, // Menyiapkan Dokumen/Laporan/Bahan kerja (56)
  41,  // Membuat laporan (64)
  150, // Merekapitulasi (52)
  4,   // Melakukan koordinasi (Dalam Daerah) (60)
  6,   // Melakukan koordinasi melalui media elektronik (20)
  111, // Mengikuti rapat (Dalam Daerah) (75)
  49,  // Memimpin rapat (100)
  78,  // Mendiskusikan (60)
  32,  // Memasukkan data (35)
];

/**
 * Deteksi otomatis aktivitas resmi dari teks deskripsi Logbook / Tindak Lanjut
 */
export function detectAktivitasFromLogbookText(text: string): AktivitasSolo | undefined {
  if (!text || !text.trim()) return undefined;
  const lower = text.toLowerCase();

  // 1. Disposisi -> ID 79: Mendisposisi (30 poin)
  if (lower.includes('disposisi') || lower.includes('mendisposisikan')) {
    return getAktivitasSoloById(79);
  }
  // 2. Agenda / Mengagenda -> ID 89: Mengagenda (21 poin)
  if (lower.includes('mengagenda') || lower.includes('agenda')) {
    return getAktivitasSoloById(89);
  }
  // 3. Konsep Surat / Naskah Dinas -> ID 123: Mengonsep Surat/Dokumen (65 poin)
  if (lower.includes('mengonsep') || lower.includes('konsep surat') || lower.includes('draft')) {
    return getAktivitasSoloById(123);
  }
  // 4. Koreksi / Verifikasi -> ID 128: Mengoreksi Keputusan/Surat/Dokumen/Data (63 poin)
  if (lower.includes('koreksi') || lower.includes('mengoreksi') || lower.includes('verifikasi')) {
    return getAktivitasSoloById(128);
  }
  // 5. Paraf -> ID 55: Memparaf Surat/Nota Dinas/Berita Acara (32 poin)
  if (lower.includes('paraf') || lower.includes('memparaf')) {
    return getAktivitasSoloById(55);
  }
  // 6. Tanda tangan -> ID 69: Menandatangani Surat/Nota Dinas/Berita Acara (40 poin)
  if (lower.includes('tandatangan') || lower.includes('tanda tangan') || lower.includes('menandatangani') || lower.includes('ttd')) {
    return getAktivitasSoloById(69);
  }
  // 7. Arsip -> ID 94: Mengarsipkan (42 poin)
  if (lower.includes('arsip') || lower.includes('mengarsipkan')) {
    return getAktivitasSoloById(94);
  }
  // 8. Telaah / Analisis Dokumen -> ID 92: Menganalisis/Mengkaji/Menelaah Dokumen Lain (105 poin)
  if (lower.includes('telaah') || lower.includes('analisis') || lower.includes('mengkaji') || lower.includes('menelaah')) {
    return getAktivitasSoloById(92);
  }
  // 9. Sebar / Distribusi Surat -> ID 119: Menyebarkan naskah dinas/dokumen/surat/brosur/leaflet (35 poin)
  if (lower.includes('sebar') || lower.includes('distribusi') || lower.includes('pemberitahuan surat')) {
    return getAktivitasSoloById(119);
  }
  // 10. Rapat koordinasi -> ID 4: Melakukan koordinasi (Dalam Daerah) (60 poin)
  if (lower.includes('koordinasi')) {
    return getAktivitasSoloById(4);
  }
  // 11. Mengikuti Rapat -> ID 111: Mengikuti rapat (Dalam Daerah) (75 poin)
  if (lower.includes('rapat') || lower.includes('meeting')) {
    return getAktivitasSoloById(111);
  }
  // 12. Tindak Lanjut / Laporan Tugas -> ID 41: Membuat laporan (64 poin)
  if (lower.includes('tindak lanjut') || lower.includes('laporan') || lower.includes('tugas')) {
    return getAktivitasSoloById(41);
  }
  // 13. Rekap -> ID 150: Merekapitulasi (52 poin)
  if (lower.includes('rekap') || lower.includes('merekapitulasi')) {
    return getAktivitasSoloById(150);
  }
  // 14. Bahan kerja / Penyiapan -> ID 142: Menyiapkan Dokumen/Laporan/Bahan kerja (56 poin)
  if (lower.includes('menyiapkan') || lower.includes('bahan kerja')) {
    return getAktivitasSoloById(142);
  }

  return undefined;
}

// Aliases untuk integrasi sistem PresensiASN
export type AktivitasASN = AktivitasSolo;
export const MASTER_AKTIVITAS_ASN = MASTER_AKTIVITAS_SOLO;
export const KATEGORI_AKTIVITAS = [
  'Semua',
  'Persuratan',
  'Manajerial',
  'Pelayanan',
  'Kesehatan',
  'Hukum',
  'Keuangan',
  'Teknis',
  'Umum',
] as const;
export const TARGET_POIN_HARIAN = 300;


