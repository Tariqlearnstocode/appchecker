import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check for new variable name first, then fallback to old name for backwards compatibility
    const applicationId = process.env.TELLER_APPLICATION_ID || process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID;
    const environment = process.env.TELLER_ENV || process.env.NEXT_PUBLIC_TELLER_ENV || 'development';

    if (!applicationId) {
      console.error('TELLER_APPLICATION_ID is not configured');
      return NextResponse.json(
        { error: 'Teller configuration is not available' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applicationId,
      environment: environment as 'sandbox' | 'development' | 'production',
    });
  } catch (error: any) {
    console.error('Error fetching Teller configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Teller configuration', details: error.message },
      { status: 500 }
    );
  }
}
