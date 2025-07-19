'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@/components/Icons';

interface OptionItem {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: string[] | OptionItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}

export default function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  className = "",
  searchable = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper functions to work with both string and object options
  const isOptionItem = (option: string | OptionItem): option is OptionItem => {
    return typeof option === 'object' && 'value' in option && 'label' in option;
  };

  const getOptionValue = (option: string | OptionItem): string => {
    return isOptionItem(option) ? option.value : option;
  };

  const getOptionLabel = (option: string | OptionItem): string => {
    return isOptionItem(option) ? option.label : option;
  };

  const getDisplayValue = (): string => {
    if (!value) return '';
    const option = options.find(opt => getOptionValue(opt) === value);
    return option ? getOptionLabel(option) : value;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (option: string | OptionItem) => {
    onChange(getOptionValue(option));
    setIsOpen(false);
    setSearchTerm('');
  };

  // Fuzzy search function
  const fuzzySearch = (text: string, query: string): boolean => {
    if (!query) return true;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  const filteredOptions = searchable 
    ? options.filter(option => fuzzySearch(getOptionLabel(option), searchTerm))
    : options;

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#2d3748] text-white px-3 py-2 rounded-lg border border-gray-600 text-left text-sm sm:text-base focus:outline-none focus:border-blue-500 flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {getDisplayValue() || placeholder}
        </span>
        <ChevronDownIcon className={`text-gray-400 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#2d3748] border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {searchable && (
            <div className="sticky top-0 bg-[#2d3748] p-2 border-b border-gray-600">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2 text-left text-sm sm:text-base hover:bg-[#374151] transition-colors ${
                  getOptionValue(option) === value 
                    ? 'bg-blue-500 text-white' 
                    : 'text-white'
                } ${index === 0 && !searchable ? 'rounded-t-lg' : ''} ${index === filteredOptions.length - 1 ? 'rounded-b-lg' : ''}`}
              >
                {getOptionValue(option) === value && (
                  <span className="inline-block w-4 h-4 mr-2">✓</span>
                )}
                {getOptionLabel(option)}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 