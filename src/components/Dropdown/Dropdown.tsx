import React from 'react';
import './Dropdown.css';
import { SearchIcon, CrossIcon, StarIcon } from '../../icons';
import { ICommonProps, EActiveTab } from '../../types';

interface DropdownProps extends ICommonProps {
  setIsOpen: (state: boolean) => void;
}

const tabs = [
  { label: EActiveTab.Favorites, icon: true },
  { label: EActiveTab.All },
];

export const Dropdown: React.FC<DropdownProps> = ({ 
  data,
  isLoading,
  isError,
  query,
  handleSetQuery,
  resetQuery,
  activeTab,
  toggleTab,
  selectedCoin,
  handleSelectCoin,
  toggleFavorite,
  setIsOpen
}) => {
  return (
    <div className="dropdown">
      <div className="dropdown__search">
        <div className="dropdown__search-icon">
          <SearchIcon />
        </div>
        <input
          type="text"
          className="dropdown__input"
          placeholder='Search...'
          value={query}
          onChange={(e) => {
            handleSetQuery(e.target.value)
          }}
        />
        {query && (
          <button 
            className="dropdown__cross-icon" 
            onClick={resetQuery}
          >
            <CrossIcon />
          </button>
        )}
      </div>

      <div className="dropdown__tabs">
        {tabs.map(tab => (
          <button
            key={tab.label}
            className={`dropdown__tab ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => {
              if (activeTab !== tab.label) { // Only toggleTab if the tab is changed
                toggleTab(tab.label);
              }
            }}
          >
            {tab.icon && <StarIcon className="dropdown__tab-icon" />}
            <div className="dropdown__tab-label">
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="header__dropdown-message">
          Loading...
        </div>
      )}

      {isError && (
        <div className="header__dropdown-message">
          Error fetching data.
        </div>
      )}

      {!isLoading && !isError && (
        <ul className="dropdown__list">
          {data.map(coin => {
            return (
              <li
                key={coin.name}
                className={`dropdown__list-item ${coin.name === selectedCoin ? 'selected' : ''}`}
                onClick={() => {handleSelectCoin(coin.name); setIsOpen(false)}}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(coin.name);
                  }}
                >
                  <StarIcon className={`dropdown__list-icon ${(coin.isFavorite) ? 'favorite' : ''}`} />
                </div>
                {coin.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
