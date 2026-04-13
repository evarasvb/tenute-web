import { NextResponse } from 'next/server';
import { isFlowEnabled } from '@/lib/flow';

/**
 * Public endpoint to check if Flow.cl payments are enabled.
 * No auth required — used by checkout to decide whether to show the button.
 */
export async function GET() {
  return NextResponse.json({ enabled: isFlowEnabled() });
}
