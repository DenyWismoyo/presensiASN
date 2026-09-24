import { describe, it, expect } from 'vitest';
import { CheckInSchema } from '@/lib/validations';

describe('Zod Validations', () => {
  it('seharusnya gagal jika format tanggal salah', () => {
    const payload = {
      userId: 'user1',
      nip: '123456789',
      nama: 'Budi',
      orgId: 'org1',
      tanggal: '24-09-2026', // Format salah, seharusnya YYYY-MM-DD
      koordinat: { lat: -7, lng: 110 },
      fotoUrl: 'https://example.com/foto.jpg',
      isValidLocation: true,
    };

    const result = CheckInSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Format tanggal harus YYYY-MM-DD');
    }
  });

  it('seharusnya berhasil jika payload valid', () => {
    const payload = {
      userId: 'user1',
      nip: '123456789',
      nama: 'Budi',
      orgId: 'org1',
      tanggal: '2026-09-24', 
      koordinat: { lat: -7, lng: 110 },
      fotoUrl: 'https://example.com/foto.jpg',
      isValidLocation: true,
    };

    const result = CheckInSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
