export interface ICoin {
  name: string;
  isFavorite: boolean;
}

export enum EActiveTab {
  All = 'all coins',
  Favorites = 'favorites',
}

export interface ICommonProps {
  data: ICoin[];
  isLoading: boolean;
  isError: boolean;
  query: string;
  handleSetQuery: (query: string) => void;
  resetQuery: () => void;
  activeTab: EActiveTab;
  toggleTab: (tab: EActiveTab) => void;
  selectedCoin: string;
  handleSelectCoin: (coin: string) => void;
  toggleFavorite: (coin: string) => void;
}
