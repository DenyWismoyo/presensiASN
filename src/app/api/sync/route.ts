import { NextResponse } from 'next/server';
import { recordCheckIn, recordCheckOut } from '@/actions/presensi';
import { submitLKH } from '@/actions/lkh';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionName, payload } = body;

    if (!actionName || !payload) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    let result;
    switch (actionName) {
      case 'checkIn':
        result = await recordCheckIn(payload);
        break;
      case 'checkOut':
        result = await recordCheckOut(payload);
        break;
      case 'submitLKH':
        result = await submitLKH(payload.userId, payload.tanggal);
        break;
      default:
        return NextResponse.json({ success: false, message: 'Action not supported for sync' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 }); // Dititipkan ke client sebagai error bisnis
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Sync API] Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
