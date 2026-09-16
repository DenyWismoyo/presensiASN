"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePegawaiList, useCreatePegawaiMutation, useDeletePegawaiMutation } from "@/hooks/usePegawai";
import { useKantorList } from "@/hooks/useKantor";
import { UserProfile, UserRole } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobilePageHeader from "@/components/dashboard/MobilePageHeader";
import {
  Users,
  UserPlus,
  Search,
  Building2,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  X,
  UserCheck,
  Briefcase,
} from "lucide-react";

export const DAFTAR_GOLONGAN_ASN = [
  { kode: "I/a - Juru Muda", label: "I/a - Juru Muda" },
  { kode: "I/b - Juru Muda Tingkat I", label: "I/b - Juru Muda Tingkat I" },
  { kode: "I/c - Juru", label: "I/c - Juru" },
  { kode: "I/d - Juru Tingkat I", label: "I/d - Juru Tingkat I" },
  { kode: "II/a - Pengatur Muda", label: "II/a - Pengatur Muda" },
  { kode: "II/b - Pengatur Muda Tingkat I", label: "II/b - Pengatur Muda Tingkat I" },
  { kode: "II/c - Pengatur", label: "II/c - Pengatur" },
  { kode: "II/d - Pengatur Tingkat I", label: "II/d - Pengatur Tingkat I" },
  { kode: "III/a - Penata Muda", label: "III/a - Penata Muda" },
  { kode: "III/b - Penata Muda Tingkat I", label: "III/b - Penata Muda Tingkat I" },
  { kode: "III/c - Penata", label: "III/c - Penata" },
  { kode: "III/d - Penata Tingkat I", label: "III/d - Penata Tingkat I" },
  { kode: "IV/a - Pembina", label: "IV/a - Pembina" },
  { kode: "IV/b - Pembina Tingkat I", label: "IV/b - Pembina Tingkat I" },
  { kode: "IV/c - Pembina Utama Muda", label: "IV/c - Pembina Utama Muda" },
  { kode: "IV/d - Pembina Utama Madya", label: "IV/d - Pembina Utama Madya" },
  { kode: "IV/e - Pembina Utama", label: "IV/e - Pembina Utama" },
];

function getRoleBadge(role: UserRole) {
  switch (role) {
    case "admin":
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-200 text-[10px] font-semibold">
          Admin BKPSDM
        </Badge>
      );
    case "atasan":
      return (
        <Badge variant="outline" className="bg-teal-500/10 text-teal-700 border-teal-200 text-[10px] font-semibold">
          Pejabat Penilai
        </Badge>
      );
    case "pegawai":
    default:
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
          Pegawai ASN
        </Badge>
      );
  }
}

function getAvatarColor(nama: string, role: UserRole) {
  if (role === "admin") return "from-rose-600 to-amber-600";
  if (role === "atasan") return "from-teal-600 to-cyan-700";
  return "from-emerald-600 to-teal-600";
}

export default function PegawaiManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKantor, setSelectedKantor] = useState("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const { data: kantorList = [] } = useKantorList(user?.orgId);
  const {
    data: pegawaiList = [],
    isLoading,
    refetch,
  } = usePegawaiList({
    search: searchQuery,
    kantorId: selectedKantor,
    role: selectedRole === "all" ? undefined : (selectedRole as UserRole),
  });

  const createMutation = useCreatePegawaiMutation();
  const deleteMutation = useDeletePegawaiMutation();

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    email: "",
    password: "asn123456",
    role: "pegawai" as UserRole,
    jabatan: "",
    golongan: "III/a - Penata Muda",
    departmentName: "Subdivisi Rekayasa Perangkat Lunak & AI",
    kantorId: "",
    atasanId: "",
    nomorHp: "",
  });

  // Filter daftar atasan yang tersedia untuk dropdown
  const atasanList = useMemo(() => {
    return pegawaiList.filter((p) => p.role === "atasan" || p.role === "admin");
  }, [pegawaiList]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = pegawaiList.length;
    const pegawaiCount = pegawaiList.filter((p) => p.role === "pegawai").length;
    const atasanCount = pegawaiList.filter((p) => p.role === "atasan").length;
    const adminCount = pegawaiList.filter((p) => p.role === "admin").length;
    return { total, pegawaiCount, atasanCount, adminCount };
  }, [pegawaiList]);

  // Handler input NIP otomatis auto-suggest email
  const handleNipChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      nip: val,
      email: prev.email || (cleanDigits ? `${cleanDigits}@asn.go.id` : ""),
    }));
  };

  const handleOpenModal = () => {
    const defaultKantor = kantorList[0]?.id || "kantor-stp";
    const defaultAtasan = atasanList[0]?.id || "";
    setFormData({
      nip: "",
      nama: "",
      email: "",
      password: "asn123456",
      role: "pegawai",
      jabatan: "Pranata Komputer Ahli Pertama",
      golongan: "III/a - Penata Muda",
      departmentName: "Subdivisi Rekayasa Perangkat Lunak & AI",
      kantorId: defaultKantor,
      atasanId: defaultAtasan,
      nomorHp: "",
    });
    setAlertMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    const kantorObj = kantorList.find((k) => k.id === formData.kantorId) || kantorList[0];
    const atasanObj = atasanList.find((a) => a.id === formData.atasanId);

    try {
      const res = await createMutation.mutateAsync({
        nip: formData.nip,
        nama: formData.nama,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        jabatan: formData.jabatan,
        golongan: formData.golongan,
        kantorId: kantorObj?.id || "kantor-stp",
        namaKantor: kantorObj?.namaKantor || "Solo Teknopark",
        departmentName: formData.departmentName,
        atasanId: atasanObj?.id,
        atasanNama: atasanObj?.nama,
        nomorHp: formData.nomorHp,
      });

      if (res.success) {
        setAlertMessage({ type: "success", text: res.message });
        await refetch();
        setTimeout(() => {
          setIsModalOpen(false);
          setAlertMessage(null);
        }, 2200);
      } else {
        setAlertMessage({ type: "error", text: res.message });
      }
    } catch (err) {
      setAlertMessage({
        type: "error",
        text: (err as Error)?.message || "Terjadi kesalahan saat mendaftarkan akun.",
      });
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (!isAdmin) return;
    if (targetUser.id === user?.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    const confirmed = window.confirm(
      `Konfirmasi penonaktifan akun ASN:\n\nNama: ${targetUser.nama}\nNIP: ${targetUser.nip}\n\nApakah Anda yakin ingin menonaktifkan akun ini?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteMutation.mutateAsync(targetUser.id);
      alert(res.message);
      await refetch();
    } catch (err) {
      alert("Gagal menonaktifkan akun: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <MobilePageHeader title="Direktori Pegawai ASN" backHref="/" />

      {/* Hero Stats Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 md:p-6 text-white shadow-md border border-emerald-800/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              BKPSDM Kota Surakarta • Manajemen Pengguna
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Data Pegawai & Pengguna ASN
            </h1>
            <p className="text-slate-300 text-xs max-w-xl">
              Kelola master direktori ASN, penugasan kantor unit geofencing, hirarki pejabat penilai LKH, dan pembuatan akun kredensial.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={handleOpenModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-4 shadow-md shadow-emerald-900/40 shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Pegawai Baru
            </Button>
          )}
        </div>

        {/* 4 Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Terdaftar</div>
            <div className="text-lg md:text-xl font-bold text-white mt-0.5">{stats.total} ASN</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Staf Pelaksana</div>
            <div className="text-lg md:text-xl font-bold text-emerald-300 mt-0.5">{stats.pegawaiCount} ASN</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">Pejabat Penilai</div>
            <div className="text-lg md:text-xl font-bold text-teal-300 mt-0.5">{stats.atasanCount} ASN</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">Admin Sistem</div>
            <div className="text-lg md:text-xl font-bold text-rose-300 mt-0.5">{stats.adminCount} Akun</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari nama, NIP, atau email pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 bg-slate-50/50 border-slate-200"
              />
            </div>

            {/* Filter Kantor */}
            <div className="w-full md:w-56">
              <select
                value={selectedKantor}
                onChange={(e) => setSelectedKantor(e.target.value)}
                className="w-full text-xs h-10 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Kantor Unit</option>
                {kantorList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.namaKantor}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Role */}
            <div className="w-full md:w-44">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full text-xs h-10 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Peran</option>
                <option value="pegawai">Pegawai ASN</option>
                <option value="atasan">Pejabat Penilai</option>
                <option value="admin">Admin BKPSDM</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="h-10 w-10 shrink-0 text-slate-600 hover:text-emerald-600"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content: Desktop Table & Mobile Cards */}
      {isLoading ? (
        <div className="h-48 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-500">
          Memuat direktori data pegawai ASN...
        </div>
      ) : pegawaiList.length === 0 ? (
        <div className="h-48 rounded-xl bg-white border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
          <Users className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-medium text-slate-600">Tidak ada pegawai yang sesuai dengan filter.</p>
          <p className="text-[11px] text-slate-400">Ubah kata kunci pencarian atau reset filter untuk melihat data.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Pegawai ASN</th>
                  <th className="py-3 px-4">Pangkat / Golongan</th>
                  <th className="py-3 px-4">Jabatan & Subdivisi</th>
                  <th className="py-3 px-4">Kantor Penugasan</th>
                  <th className="py-3 px-4">Atasan Langsung</th>
                  <th className="py-3 px-4">Peran</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pegawaiList.map((p) => {
                  const initial = p.nama.charAt(0).toUpperCase();
                  const avatarGradient = getAvatarColor(p.nama, p.role);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & NIP */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatarGradient} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{p.nama}</div>
                            <div className="text-[11px] text-slate-500 font-mono">NIP: {p.nip}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {p.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Golongan */}
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px] py-0.5 font-medium">
                          {p.golongan || "—"}
                        </Badge>
                      </td>

                      {/* Jabatan & Divisi */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{p.jabatan}</div>
                        <div className="text-[11px] text-slate-500">{p.departmentName}</div>
                      </td>

                      {/* Kantor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p.namaKantor || "Solo Teknopark"}</span>
                        </div>
                      </td>

                      {/* Atasan Langsung */}
                      <td className="py-3 px-4">
                        {p.atasanNama ? (
                          <div className="text-slate-700">
                            <div className="font-medium">{p.atasanNama}</div>
                            <div className="text-[10px] text-slate-400">Penilai Kinerja</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">— Mandiri / Pimpinan</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">{getRoleBadge(p.role)}</td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={p.id === user?.id}
                            onClick={() => handleDeleteUser(p)}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Nonaktifkan Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {pegawaiList.map((p) => {
              const initial = p.nama.charAt(0).toUpperCase();
              const avatarGradient = getAvatarColor(p.nama, p.role);

              return (
                <Card key={p.id} className="border-slate-200 shadow-xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGradient} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}
                        >
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm leading-tight">{p.nama}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">NIP: {p.nip}</div>
                        </div>
                      </div>
                      {getRoleBadge(p.role)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-slate-400">Jabatan:</div>
                        <div className="font-medium text-slate-800">{p.jabatan}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Golongan:</div>
                        <div className="font-medium text-slate-800">{p.golongan || "—"}</div>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-1 bg-slate-50 p-2.5 rounded-lg text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Kantor: {p.namaKantor || "Solo Teknopark"}</span>
                      </div>
                      {p.atasanNama && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Atasan: {p.atasanNama}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    </div>

                    {isAdmin && p.id !== user?.id && (
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(p)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] h-8 border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Nonaktifkan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Dialog: Pendaftaran Akun ASN Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Pendaftaran Pegawai ASN Baru</h2>
                  <p className="text-xs text-slate-300">Pembuatan kredensial login ganda & profil kedinasan resmi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCreate} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {alertMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                    alertMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {alertMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{alertMessage.text}</span>
                </div>
              )}

              {/* Grid 2 Kolom Identitas ASN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Nomor Induk Pegawai (NIP) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: 19930512 201901 1 003"
                    value={formData.nip}
                    onChange={(e) => handleNipChange(e.target.value)}
                    className="text-xs h-9"
                  />
                  <p className="text-[10px] text-slate-400">18 digit angka standar BKN</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Rahmat Hidayat, S.STP, M.M."
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Grid 2 Kolom Kredensial Login */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Email Kedinasan Login <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="nama.pegawai@surakarta.go.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Kata Sandi Awal
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPassword ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-xs h-9 bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Default sistem: <code className="text-emerald-700">asn123456</code></p>
                </div>
              </div>

              {/* Grid 3 Kolom Peran, Golongan & Jabatan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Peran Sistem (Role) <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pegawai">Pegawai ASN (Staf)</option>
                    <option value="atasan">Pejabat Penilai (Atasan)</option>
                    <option value="admin">Administrator (BKPSDM)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Pangkat & Golongan Ruang <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    value={formData.golongan}
                    onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {DAFTAR_GOLONGAN_ASN.map((g) => (
                      <option key={g.kode} value={g.kode}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jabatan & Unit Kerja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Nama Jabatan Kedinasan <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Pranata Komputer Ahli Pertama"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Subdivisi / Bidang Unit
                  </Label>
                  <Input
                    type="text"
                    placeholder="Contoh: Subdivisi Rekayasa Perangkat Lunak"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Kantor Unit & Atasan Langsung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Kantor Penugasan Geofencing <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    value={formData.kantorId}
                    onChange={(e) => setFormData({ ...formData, kantorId: e.target.value })}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {kantorList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.namaKantor} (Radius {k.radiusMeter}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    Atasan Langsung (Penilai LKH)
                  </Label>
                  <select
                    value={formData.atasanId}
                    onChange={(e) => setFormData({ ...formData, atasanId: e.target.value })}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— Tidak Ada (Pejabat Utama) —</option>
                    {atasanList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama} ({a.jabatan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kontak WhatsApp */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Nomor Handphone / WhatsApp Dinas
                </Label>
                <Input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={formData.nomorHp}
                  onChange={(e) => setFormData({ ...formData, nomorHp: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs h-9 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-5 shadow-sm"
                >
                  {createMutation.isPending ? "Mendaftarkan Akun..." : "Daftarkan Akun ASN"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
