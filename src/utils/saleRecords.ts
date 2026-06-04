import type { TradeInPhone } from './simulator';
import { calculateTradeProfit } from './simulator';

export function parseTradeInsFromNotes(notes: string | null): TradeInPhone[] {
  if (!notes) return [{ model: '', receivedPrice: 0, resalePrice: 0 }];
  try {
    const parsed = JSON.parse(notes) as { trade_ins?: TradeInPhone[] };
    if (Array.isArray(parsed.trade_ins) && parsed.trade_ins.length > 0) {
      return parsed.trade_ins.map((t) => ({
        model: t.model ?? '',
        receivedPrice: Number(t.receivedPrice) || 0,
        resalePrice: Number(t.resalePrice) || 0,
      }));
    }
  } catch {
    /* notas sin JSON de permuta */
  }
  return [{ model: '', receivedPrice: 0, resalePrice: 0 }];
}

export function buildVentaDraftUpdate(
  phoneModel: string,
  buyPrice: number,
  sellPrice: number,
) {
  return {
    title: phoneModel || 'Venta directa',
    phone_model: phoneModel || null,
    total_cost: buyPrice,
    total_revenue: sellPrice,
  };
}

export function buildCambioDraftUpdate(
  myModel: string,
  buyPrice: number,
  sellPriceToClient: number,
  cashFromCustomer: number,
  tradeIns: TradeInPhone[],
) {
  const result = calculateTradeProfit({
    buyPrice,
    sellPriceToClient,
    cashFromCustomer,
    tradeIns,
  });
  return {
    title: myModel || 'Cambio / permuta',
    phone_model: myModel || null,
    notes: JSON.stringify({ trade_ins: tradeIns }),
    trade_in_total: result.receivedTotal,
    cash_adjustment: cashFromCustomer,
    total_cost: buyPrice,
    total_revenue: result.totalIncome,
    total_profit: result.totalProfit,
    margin_percent: result.marginPercent,
  };
}

export function buildVentaDraftPayload(
  businessId: number,
  phoneModel: string,
  buyPrice: number,
  sellPrice: number,
) {
  return {
    business_id: businessId,
    title: phoneModel || 'Venta directa',
    phone_model: phoneModel || null,
    sale_type: 'venta',
    record_status: 'draft',
    notes: null,
    trade_in_total: null,
    cash_adjustment: null,
    items: [{
      name: phoneModel || 'Celular',
      quantity_received: 1,
      quantity_bought: 1,
      quantity_to_sell: 1,
      buy_price: buyPrice,
      sell_price: sellPrice,
    }],
  };
}

export function buildCambioDraftPayload(
  businessId: number,
  myModel: string,
  buyPrice: number,
  sellPriceToClient: number,
  cashFromCustomer: number,
  tradeIns: TradeInPhone[],
) {
  const result = calculateTradeProfit({
    buyPrice,
    sellPriceToClient,
    cashFromCustomer,
    tradeIns,
  });
  return {
    business_id: businessId,
    title: myModel || 'Cambio / permuta',
    phone_model: myModel || null,
    sale_type: 'cambio',
    record_status: 'draft',
    notes: JSON.stringify({ trade_ins: tradeIns }),
    trade_in_total: result.receivedTotal,
    cash_adjustment: cashFromCustomer,
    total_cost_override: buyPrice,
    total_revenue_override: result.totalIncome,
    total_profit_override: result.totalProfit,
    margin_percent_override: result.marginPercent,
    items: [{
      name: myModel || 'Mi celular',
      quantity_received: 1,
      quantity_bought: 1,
      quantity_to_sell: 1,
      buy_price: buyPrice,
      sell_price: sellPriceToClient,
    }],
  };
}
