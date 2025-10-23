export interface DashboardMetric {
  name: string;
  value: string;
  description: string;
}

export interface ChartDataPoint {
  month: string;
  engagement: number;
}

export interface ClientDashboard {
  id: string;
  client_id: string;
  report_period: string;
  description: string;
  metrics: DashboardMetric[];
  recommendation: string;
  chart_data: ChartDataPoint[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DashboardFormData {
  client_id: string;
  report_period: string;
  description: string;
  metrics: DashboardMetric[];
  recommendation: string;
  chart_data: ChartDataPoint[];
}
