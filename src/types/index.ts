export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface Business {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DashboardKPIs {
  total_businesses: number;
  total_profit: string;
  pending_payments: number;
  overdue_payments: number;
  upcoming_payments: number;
  total_notes: number;
  upcoming_events: number;
}

export interface BusinessSummary {
  id: number;
  name: string;
  total_profit: string;
  pending_payments: number;
}

export interface ProfitabilityItem {
  id?: number;
  name: string;
  quantity_received: number;
  quantity_bought: number;
  quantity_to_sell: number;
  buy_price: number;
  sell_price: number;
  profit?: string;
  margin_percent?: string;
}

export interface ProfitabilityRecord {
  id: number;
  business_id: number;
  title: string;
  notes: string | null;
  total_cost: string;
  total_revenue: string;
  total_profit: string;
  margin_percent: string;
  sale_type: string;
  phone_model: string | null;
  trade_in_total: string | null;
  cash_adjustment: string | null;
  record_status: string;
  created_at: string;
  items: ProfitabilityItem[];
}

export interface MonthOverview {
  month: number;
  year: number;
  label: string;
  profit: string;
  margin_percent: string;
  sales_count: number;
  payments_total: string;
  payments_pending: string;
  base_profit: string;
  suggested_goal: string;
  goal_id: number | null;
  business_id: number | null;
  target_amount: string;
  remaining: string;
  percent_complete: string;
  is_custom_goal: boolean;
}

export interface Payment {
  id: number;
  business_id: number | null;
  concept: string;
  amount: string;
  due_date: string;
  status: string;
  category: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurring_day: number | null;
  recurring_template_id: number | null;
  created_at: string;
}

export interface MonthlySalesStat {
  month: number;
  year: number;
  label: string;
  profit: string;
  revenue: string;
  sales_count: number;
}

export interface MonthInvestmentSummary {
  month: number;
  year: number;
  total_cost: string;
  total_profit: string;
  sales_count: number;
  margin_percent: string;
}

export interface SaleTypeStat {
  sale_type: string;
  count: number;
  profit: string;
}

export interface RecentSaleSummary {
  id: number;
  business_id: number;
  title: string;
  phone_model: string | null;
  sale_type: string;
  total_cost: string;
  total_profit: string;
  margin_percent: string;
  created_at: string;
}

export interface DashboardHome {
  kpis: DashboardKPIs;
  month_goal: MonthOverview;
  monthly_sales: MonthlySalesStat[];
  investment: MonthInvestmentSummary;
  recent_sales: RecentSaleSummary[];
  alerts: AlertItem[];
}

export interface AlertItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  link: string | null;
}

export interface Note {
  id: number;
  business_id: number | null;
  title: string;
  content: string;
  priority: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  id: number;
  business_id: number;
  business_name: string;
  year: number;
  month: number;
  target_amount: string;
  current_amount: string;
  remaining: string;
  percent_complete: string;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  business_id: number | null;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  created_at: string;
}
