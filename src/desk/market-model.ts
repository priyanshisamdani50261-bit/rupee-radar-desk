export const INDEX_SYMBOLS = [
  {name:"NIFTY 50",symbol:"^NSEI"}, {name:"SENSEX",symbol:"^BSESN"}, {name:"BANK NIFTY",symbol:"^NSEBANK"}, {name:"INDIA VIX",symbol:"^INDIAVIX"}, {name:"DOW JONES",symbol:"^DJI"},
  {name:"Bank",symbol:"^NSEBANK"}, {name:"IT",symbol:"^CNXIT"}, {name:"Auto",symbol:"^CNXAUTO"}, {name:"Pharma",symbol:"^CNXPHARMA"}, {name:"FMCG",symbol:"^CNXFMCG"}, {name:"Metal",symbol:"^CNXMETAL"}, {name:"Realty",symbol:"^CNXREALTY"}, {name:"Energy",symbol:"^CNXENERGY"}, {name:"Infra",symbol:"^CNXINFRA"},
];
export type Quote = { name:string;symbol:string;value:number;chg:number;time:string };
export type QuoteResult = { quotes:Quote[];errors:string[];fetchedAt:string };