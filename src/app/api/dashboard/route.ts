import { NextResponse } from 'next/server';
import { getRawDashboardDataFromExcel } from '@/lib/excelParser';

export async function GET() {
  try {
    const rawData = getRawDashboardDataFromExcel();
    return NextResponse.json(rawData);
  } catch (error) {
    console.error('Error fetching dashboard raw data:', error);
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 });
  }
}
