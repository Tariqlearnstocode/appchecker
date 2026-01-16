'use client';

import { useEffect, useState, useRef } from 'react';

interface Institution {
  id: string;
  name: string;
  products: string[];
}

export default function SupportedBanksPage() {
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
          // Sort alphabetically by name
          const sorted = data.institutions.sort((a: Institution, b: Institution) =>
            a.name.localeCompare(b.name)
          );
          setInstitutions(sorted);
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

  // Filter institutions by search term
  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by first character (letter or number) for easier browsing
  // All numbers are grouped under "#"
  const groupedByLetter: Record<string, Institution[]> = {};
  filteredInstitutions.forEach(inst => {
    const firstChar = inst.name.charAt(0).toUpperCase();
    // Group all numbers under "#", otherwise use the letter
    const groupKey = /[0-9]/.test(firstChar) ? '#' : firstChar;
    if (!groupedByLetter[groupKey]) {
      groupedByLetter[groupKey] = [];
    }
    groupedByLetter[groupKey].push(inst);
  });

  const sortedLetters = Object.keys(groupedByLetter).sort((a, b) => {
    // Sort letters alphabetically, then "#" last
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
  
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to section when letter is clicked
  const scrollToLetter = (letter: string) => {
    const element = sectionRefs.current[letter];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Supported Banks & Financial Institutions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We support connections to over 7,000 U.S. banks and credit unions through our secure banking partner, Teller.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search for your bank..."
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
          {searchTerm && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Showing {filteredInstitutions.length} of {institutions.length} institutions
            </p>
          )}
        </div>

        {/* Letter Selector - Only show letters/numbers that have banks */}
        {!loading && !error && sortedLetters.length > 0 && (
          <div className="mb-6 flex flex-wrap justify-center gap-2 px-4">
            {sortedLetters.map(letter => (
              <button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                className="px-3 py-1.5 text-sm font-medium rounded transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-gray-600">Loading supported banks...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Institutions List */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {sortedLetters.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No banks found matching "{searchTerm}"
              </div>
            ) : (
              <div>
                {sortedLetters.map(letter => (
                  <div 
                    key={letter} 
                    ref={(el) => { sectionRefs.current[letter] = el; }}
                    className="mb-8 scroll-mt-4"
                  >
                    {/* Large circular letter/number header */}
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold mr-3">
                        {letter}
                      </div>
                    </div>
                    {/* 3-column list with tight spacing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 ml-[52px]">
                      {groupedByLetter[letter].map(inst => (
                        <div
                          key={inst.id}
                          className="text-gray-900 hover:text-emerald-600 transition-colors"
                        >
                          {inst.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        {!loading && !error && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Don't see your bank? Contact us and we can help you connect your accounts.
            </p>
            <p className="mt-2">
              All connections are secure and bank-level encrypted. Your credentials are never stored.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
