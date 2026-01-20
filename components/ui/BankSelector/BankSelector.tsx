'use client';

import { useState, useEffect, useMemo } from 'react';

export interface Institution {
  id: string;
  name: string;
  products: string[];
  isPopular?: boolean;
}

interface BankSelectorProps {
  /** Callback when an institution is selected */
  onSelect?: (institution: Institution) => void;
  /** Custom placeholder text for search */
  searchPlaceholder?: string;
  /** Custom className for the container */
  className?: string;
}

// Popular bank name patterns (case-insensitive matching)
const POPULAR_BANK_PATTERNS = [
  /^bank of america/i,
  /^chase/i,
  /^pnc/i,
  /^capital one/i,
  /^us bank/i,
  /^citi/i,
  /^american express/i,
  /^amex/i,
  /^regions/i,
  /^wells fargo/i,
  /^td bank/i,
  /^truist/i,
  /^discover/i,
  /^ally/i,
];

export function BankSelector({
  onSelect,
  searchPlaceholder = 'Search for your bank...',
  className = '',
}: BankSelectorProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const response = await fetch('/api/teller/institutions');
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          // Step 1: Sort A-Z
          const sorted = data.institutions.sort((a: Institution, b: Institution) =>
            a.name.localeCompare(b.name)
          );

          // Step 2: Add popular tag to 9 banks
          const withPopular = sorted.map((inst: Institution) => {
            const isPopular = POPULAR_BANK_PATTERNS.some(pattern => pattern.test(inst.name));
            return { ...inst, isPopular };
          });

          setInstitutions(withPopular);
        }
      } catch (err) {
        setError('Failed to load supported banks');
        console.error('Error fetching institutions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInstitutions();
  }, []);

  // Step 3: Popular first, then rest (sorted A-Z)
  const sortedInstitutions = useMemo(() => {
    const popular = institutions.filter(inst => inst.isPopular).slice(0, 9);
    const rest = institutions.filter(inst => !inst.isPopular);
    return [...popular, ...rest];
  }, [institutions]);

  // Step 4: Filter by search term
  const displayedInstitutions = useMemo(() => {
    let results;
    if (searchTerm) {
      results = sortedInstitutions.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Show all banks (popular first, then rest) - scrollable
      results = sortedInstitutions;
    }
    // Limit to 75 banks max
    return results.slice(0, 75);
  }, [sortedInstitutions, searchTerm]);

  // Get logo URL for institution
  const getLogoUrl = (institutionId: string) => {
    return `https://cdn.teller.io/web/images/banks/${institutionId}.jpg`;
  };

  const handleInstitutionClick = (institution: Institution) => {
    onSelect?.(institution);
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-gray-600">Loading supported banks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center ${className}`}>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white border border-gray-200 shadow-lg rounded-lg p-6 ${className}`}>
      {/* Search Bar */}
      <div className="mb-6 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area - Shows first 3 rows, scrollable for more */}
      <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
        {/* 3x3 Grid */}
        {displayedInstitutions.length > 0 ? (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4">
              {displayedInstitutions.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => handleInstitutionClick(inst)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
                >
                  <img
                    src={getLogoUrl(inst.id)}
                    alt={`${inst.name} logo`}
                    className="w-12 h-12 object-contain flex-shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-gray-700 group-hover:text-emerald-700 text-center line-clamp-2">
                    {inst.name}
                  </span>
                </button>
              ))}
            </div>
            {!searchTerm && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Search above to find from over 7,000 supported institutions
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No banks found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
