import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Conversion rate relative to INR
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095 },
};

interface CurrencyContextType {
  currentCurrency: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  formatAmount: (amountInINR: number, showDecimals?: boolean) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('app_currency');
    return (saved as CurrencyCode) || 'INR';
  });

  useEffect(() => {
    localStorage.setItem('app_currency', currencyCode);
  }, [currencyCode]);

  const currentCurrency = CURRENCIES[currencyCode] || CURRENCIES.INR;

  const setCurrency = (code: CurrencyCode) => {
    if (CURRENCIES[code]) {
      setCurrencyCode(code);
    }
  };

  const formatAmount = (amountInINR: number, showDecimals: boolean = false): string => {
    if (amountInINR === undefined || amountInINR === null || isNaN(amountInINR)) {
      return `${currentCurrency.symbol}0`;
    }

    const converted = amountInINR * currentCurrency.rate;
    const isNegative = converted < 0;
    const absVal = Math.abs(converted);

    // Format based on currency
    let formatted: string;
    if (currentCurrency.code === 'INR') {
      formatted = absVal.toLocaleString('en-IN', {
        maximumFractionDigits: showDecimals ? 2 : 0,
        minimumFractionDigits: showDecimals ? 2 : 0,
      });
    } else {
      formatted = absVal.toLocaleString('en-US', {
        maximumFractionDigits: showDecimals ? 2 : 2,
        minimumFractionDigits: showDecimals ? 2 : 0,
      });
    }

    return `${isNegative ? '-' : ''}${currentCurrency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currentCurrency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
