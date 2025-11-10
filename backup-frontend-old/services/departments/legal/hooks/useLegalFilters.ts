import { useState } from 'react';

export const useLegalFilters = () => {
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});

  const applyFilters = (newFilters) => {
    setActiveFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setActiveFilters({});
  };

  return {
    filters,
    setFilters,
    activeFilters,
    applyFilters,
    clearFilters
  };
};