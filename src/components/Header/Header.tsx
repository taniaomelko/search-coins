import React, { useEffect, useRef, useState } from 'react';
import './Header.css';
import { Dropdown } from '../Dropdown/Dropdown';
import { SearchIcon } from '../../icons';
import { EActiveTab } from '../../types';
import { getData } from '../../data/data';
import { ICoin } from '../../types';

interface HeaderProps {
  selectedCoin: string;
  handleSelectCoin: (coin: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  selectedCoin, handleSelectCoin
}) => {
  const [data, setData] = useState<ICoin[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<EActiveTab>(EActiveTab.All);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();

      if (!data) {
        setIsError(true);
        setIsLoading(false);
        return;
      }

      const filteredData = data.filter((coin: string) => coin.trim() !== '');

      const updatedData = filteredData.map((coin: string) => ({
        name: coin,
        isFavorite: false,
      }));

      setData(updatedData);
      setIsLoading(false);
    };
  
    fetchData();
  }, []);

  const handleSetQuery = (query: string) => {
    setQuery(query);
  }

  const resetQuery = () => {
    setQuery('');
  }

  const toggleTab = (tab: EActiveTab) => {
    setActiveTab(tab);
  }

  const toggleFavorite = (coinName: string) => {
    const coins = data.map((coin) =>
      coin.name === coinName
        ? { ...coin, isFavorite: !coin.isFavorite }
        : coin
    );
    setData(coins);
  }

  // Filter data based on the active tab and the query
  const filteredData = data.filter((coin) => {
    const matchesQuery = coin.name.toLowerCase().includes(query.toLowerCase());
    const matchesTab = activeTab === EActiveTab.All || (activeTab === EActiveTab.Favorites && coin.isFavorite);
    return matchesQuery && matchesTab;
  });

  // Close dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <header className="header">
      <div className="container">
        <div className="header__wrapper">
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`header__button ${isOpen ? 'open' : ''}`}
          >
            <SearchIcon />
            Search
          </button>

          {isOpen && (
            <div className="header__dropdown" ref={dropdownRef}>
              <div className="header__dropdown-wrapper">
                <Dropdown
                  data={filteredData}
                  isLoading={isLoading}
                  isError={isError}
                  query={query}
                  handleSetQuery={handleSetQuery}
                  resetQuery={resetQuery}
                  activeTab={activeTab}
                  toggleTab={toggleTab}
                  selectedCoin={selectedCoin}
                  handleSelectCoin={handleSelectCoin}
                  toggleFavorite={toggleFavorite}
                  setIsOpen={setIsOpen}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
