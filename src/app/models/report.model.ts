export interface ReportSummary {
    totalOrders: number;
    totalRevenue: number;
    totalItemsSold: number;
    averageOrderValue: number;
    todayOrders: number;
    todayRevenue: number;
}

export interface SalesTrendPoint {
    date: string;
    orders: number;
    revenue: number;
}

export interface TopItem {
    itemName: string;
    quantity: number;
    revenue: number;
}

export interface CategorySales {
    category: string;
    quantity: number;
    revenue: number;
}

export interface PaymentMethodBreakdown {
    paymentMethod: string;
    orders: number;
    revenue: number;
}

export interface CashierPerformance {
    cashier: string;
    orders: number;
    revenue: number;
}

export interface ReportDashboard {
    summary: ReportSummary;
    salesTrend: SalesTrendPoint[];
    topItems: TopItem[];
    categorySales: CategorySales[];
    paymentMethods: PaymentMethodBreakdown[];
    cashierPerformance: CashierPerformance[];
}
