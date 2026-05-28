export function suggestSellPrice(buyPrice: number, marginPercent: number) {
  const sell = buyPrice * (1 + marginPercent / 100);
  return {
    sellPrice: Math.round(sell),
    profit: Math.round(sell - buyPrice),
    marginPercent,
  };
}

export interface TradeInPhone {
  model: string;
  receivedPrice: number;
  resalePrice: number;
}

export function calculateTradeProfit(params: {
  buyPrice: number;
  sellPriceToClient: number;
  cashFromCustomer: number;
  tradeIns: TradeInPhone[];
}) {
  const receivedTotal = params.tradeIns.reduce((s, p) => s + (p.receivedPrice || 0), 0);
  const resaleTotal = params.tradeIns.reduce((s, p) => s + (p.resalePrice || 0), 0);
  const tradeInProfit = params.tradeIns.reduce(
    (s, p) => s + ((p.resalePrice || 0) - (p.receivedPrice || 0)),
    0,
  );

  const myPhoneProfit = params.sellPriceToClient - params.buyPrice;
  const totalProfit = myPhoneProfit + tradeInProfit;

  const paymentTotal = params.cashFromCustomer + receivedTotal;
  const paymentDiff = params.sellPriceToClient - paymentTotal;

  const totalIncome = params.cashFromCustomer + resaleTotal;
  const marginPercent = params.buyPrice > 0 ? (totalProfit / params.buyPrice) * 100 : 0;

  return {
    receivedTotal,
    resaleTotal,
    tradeInProfit: Math.round(tradeInProfit),
    myPhoneProfit: Math.round(myPhoneProfit),
    totalProfit: Math.round(totalProfit),
    totalIncome: Math.round(totalIncome),
    paymentTotal: Math.round(paymentTotal),
    paymentDiff: Math.round(paymentDiff),
    marginPercent,
    tradeInBreakdown: params.tradeIns.map((p) => ({
      model: p.model,
      receivedPrice: p.receivedPrice || 0,
      resalePrice: p.resalePrice || 0,
      profit: Math.round((p.resalePrice || 0) - (p.receivedPrice || 0)),
    })),
  };
}
