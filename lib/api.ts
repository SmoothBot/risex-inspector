const API_BASE = "https://api.staging.rise.trade";

export interface Trade {
  id: string;
  market_id: string;
  order_id: string;
  side: string;
  price: string;
  size: string;
  fee: string;
  liquidity_indicator: string;
  time: string;
  blockchain_data: {
    block_number: string;
    tx_hash: string;
    log_index: string;
  };
  is_liquidation: boolean;
  realized_pnl: string;
  leverage: string;
  margin_mode: number;
  realized_pnl_percentage: string;
  avg_price: string;
  position_side: string;
  is_otc: boolean;
}

export interface TradeHistoryResponse {
  data: {
    market_id: string;
    wallet_address: string;
    trades: Trade[];
    page: number;
    has_next_page: boolean;
  };
}

export interface PortfolioSummary {
  collateral_margin_balance: string;
  cross_margin_balance: string;
  margin_usage: string;
  account_leverage: string;
  in_liquidation: boolean;
  free_collateral: string;
  total_account_value: string;
  total_notional: string;
  usdc_balance: string;
  total_unrealized_pnl: string;
  total_initial_margin: string;
  total_maintenance_margin: string;
  realized_pnl: string;
  margin_health: string;
  risk_level: string;
}

export interface Position {
  size: string;
  market_id: string;
  market_name: string;
  avg_entry_price: string;
  mark_price: string;
  leverage: string;
  margin_mode: number;
  unrealized_pnl: string;
  liquidation_price: string;
  side: number;
  index_price: string;
  initial_margin_requirement: string;
  maintenance_margin_requirement: string;
}

export interface PortfolioResponse {
  data: {
    account: string;
    summary: PortfolioSummary;
    positions: Position[];
  };
}

export function getMarketName(id: string): string {
  return id;
}

export async function fetchTradeHistory(
  account: string,
  limit: number = 50
): Promise<TradeHistoryResponse> {
  const res = await fetch(
    `${API_BASE}/v1/trade-history?account=${account}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchPortfolio(
  account: string
): Promise<PortfolioResponse> {
  const res = await fetch(
    `${API_BASE}/v1/portfolio/details?account=${account}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
