import React from 'react';
import './Coin.css'

interface CoinProps {
  selectedCoin: string;
  resetSelectedCoin: () => void;
}

export const Coin: React.FC<CoinProps> = ({ selectedCoin, resetSelectedCoin }) => {

  return (
    <section className="coin">
      <div className="container">
        {selectedCoin && (
          <>
            <div>
              Selected coin: {selectedCoin}
            </div>
          
            <button 
              className="coin__reset" 
              onClick={resetSelectedCoin}
            >
              reset
            </button>
          </>
        )}
      </div>
    </section>
  );
};
