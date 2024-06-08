import { useState } from 'react';
import './App.css';
import { Header } from './components/Header/Header';
import { Coin } from './components/Coin/Coin';

function App() {
  const [selectedCoin, setSelectedCoin] = useState<string>('');

  const handleSelectCoin = (coin: string) => {
    setSelectedCoin(coin);
  }

  const resetSelectedCoin = () => {
    setSelectedCoin('');
  }

  return (
    <>
      <Header 
        selectedCoin={selectedCoin}
        handleSelectCoin={handleSelectCoin}
      />
      <Coin
        selectedCoin={selectedCoin}
        resetSelectedCoin={resetSelectedCoin}
      />
    </>
  )
}

export default App;
