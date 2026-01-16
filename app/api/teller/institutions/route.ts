import { NextRequest, NextResponse } from 'next/server';

const TELLER_API_URL = 'https://api.teller.io';

// In-memory cache for institutions (refreshes every hour)
let cachedInstitutions: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch supported institutions from Teller API
 * No authentication required for this endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we have a valid cache
    const now = Date.now();
    if (cachedInstitutions && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        institutions: cachedInstitutions,
        cached: true,
        count: cachedInstitutions.length,
      });
    }

    // Fetch from Teller API
    const response = await fetch(`${TELLER_API_URL}/institutions`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch institutions from Teller:', {
        status: response.status,
        statusText: response.statusText,
      });
      return NextResponse.json(
        { error: 'Failed to fetch institutions', details: response.statusText },
        { status: response.status }
      );
    }

    const institutions = await response.json();

    // Update cache
    cachedInstitutions = institutions;
    cacheTimestamp = now;

    return NextResponse.json({
      institutions,
      cached: false,
      count: institutions.length,
    });
  } catch (error: any) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions', details: error.message },
      { status: 500 }
    );
  }
}
