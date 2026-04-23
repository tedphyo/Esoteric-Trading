// Expand this list without changing search or numerology code.
// `date` is the MM/DD/YYYY value used by the numerology engine.
// If only a year/month is known, we use Jan 1 or the first of the month and label the precision.
window.ESOTERIC_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Stock', date: '04/01/1976', foundedLabel: 'Apr 1, 1976', foundedPrecision: 'day', chart: 'NASDAQ:AAPL' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'Stock', date: '04/04/1975', foundedLabel: 'Apr 4, 1975', foundedPrecision: 'day', chart: 'NASDAQ:MSFT' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Stock', date: '04/05/1993', foundedLabel: 'Apr 5, 1993', foundedPrecision: 'day', chart: 'NASDAQ:NVDA' },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '05/01/1969', foundedLabel: 'May 1, 1969', foundedPrecision: 'day', chart: 'NASDAQ:AMD' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', type: 'Stock', date: '07/18/1968', foundedLabel: 'Jul 18, 1968', foundedPrecision: 'day', chart: 'NASDAQ:INTC' },
  { symbol: 'MSTR', name: 'MicroStrategy Incorporated', exchange: 'NASDAQ', type: 'Stock', date: '11/01/1989', foundedLabel: 'Nov 1989 (month-level fallback)', foundedPrecision: 'month', chart: 'NASDAQ:MSTR' },
  { symbol: 'COIN', name: 'Coinbase Global, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '06/01/2012', foundedLabel: 'Jun 2012 (month-level fallback)', foundedPrecision: 'month', chart: 'NASDAQ:COIN' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '07/01/2003', foundedLabel: 'Jul 1, 2003', foundedPrecision: 'day', chart: 'NASDAQ:TSLA' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '02/04/2004', foundedLabel: 'Feb 4, 2004', foundedPrecision: 'day', chart: 'NASDAQ:META' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'Stock', date: '09/04/1998', foundedLabel: 'Sep 4, 1998', foundedPrecision: 'day', chart: 'NASDAQ:GOOGL' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '07/05/1994', foundedLabel: 'Jul 5, 1994', foundedPrecision: 'day', chart: 'NASDAQ:AMZN' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '08/29/1997', foundedLabel: 'Aug 29, 1997', foundedPrecision: 'day', chart: 'NASDAQ:NFLX' },
  { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', type: 'Stock', date: '06/16/1977', foundedLabel: 'Jun 16, 1977', foundedPrecision: 'day', chart: 'NYSE:ORCL' },
  { symbol: 'IBM', name: 'International Business Machines Corporation', exchange: 'NYSE', type: 'Stock', date: '06/16/1911', foundedLabel: 'Jun 16, 1911', foundedPrecision: 'day', chart: 'NYSE:IBM' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', type: 'Stock', date: '12/01/2000', foundedLabel: 'Dec 2000 (month-level fallback)', foundedPrecision: 'month', chart: 'NYSE:JPM' },
  { symbol: 'GS', name: 'Goldman Sachs Group, Inc.', exchange: 'NYSE', type: 'Stock', date: '01/01/1869', foundedLabel: '1869 (year-only fallback)', foundedPrecision: 'year', chart: 'NYSE:GS' },
  { symbol: 'BAC', name: 'Bank of America Corporation', exchange: 'NYSE', type: 'Stock', date: '10/17/1904', foundedLabel: 'Oct 17, 1904', foundedPrecision: 'day', chart: 'NYSE:BAC' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', type: 'Stock', date: '07/02/1962', foundedLabel: 'Jul 2, 1962', foundedPrecision: 'day', chart: 'NYSE:WMT' },
  { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE', type: 'Stock', date: '10/16/1923', foundedLabel: 'Oct 16, 1923', foundedPrecision: 'day', chart: 'NYSE:DIS' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', exchange: 'NASDAQ', type: 'Stock', date: '01/01/2003', foundedLabel: '2003 (year-only fallback)', foundedPrecision: 'year', chart: 'NASDAQ:PLTR' },
  { symbol: 'SOFI', name: 'SoFi Technologies, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '08/01/2011', foundedLabel: 'Aug 2011 (month-level fallback)', foundedPrecision: 'month', chart: 'NASDAQ:SOFI' },
  { symbol: 'PYPL', name: 'PayPal Holdings, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '12/01/1998', foundedLabel: 'Dec 1998 (month-level fallback)', foundedPrecision: 'month', chart: 'NASDAQ:PYPL' },
  { symbol: 'HOOD', name: 'Robinhood Markets, Inc.', exchange: 'NASDAQ', type: 'Stock', date: '04/18/2013', foundedLabel: 'Apr 18, 2013', foundedPrecision: 'day', chart: 'NASDAQ:HOOD' },
  { symbol: 'SHOP', name: 'Shopify Inc.', exchange: 'NYSE', type: 'Stock', date: '01/01/2006', foundedLabel: '2006 (year-only fallback)', foundedPrecision: 'year', chart: 'NYSE:SHOP' },
  { symbol: 'BABA', name: 'Alibaba Group Holding Limited', exchange: 'NYSE', type: 'Stock', date: '04/04/1999', foundedLabel: 'Apr 4, 1999', foundedPrecision: 'day', chart: 'NYSE:BABA' }
];
