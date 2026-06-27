export interface OrderItem {
    id?: number;
    order_id?: number;
    item_id: number | null;
    item_name: string;
    quantity: number;
    subtotal: number;
}

export interface Order {
    id?: number;
    invoice_number: string;
    subtotal?: number;
    total: number;
    payment_status: string;
    cashier_name: string;
    discount_type?: 'percentage' | 'fixed' | null;
    discount_value?: number;
    discount_amount?: number;
    created_at?: string;
    items?: OrderItem[];
}

export interface CreateOrderRequest {
    subtotal?: number;
    total: number;
    cashier_name: string;
    discount_type?: 'percentage' | 'fixed' | null;
    discount_value?: number;
    discount_amount?: number;
    items: {
        item_id: number | null;
        item_name: string;
        quantity: number;
        subtotal: number;
    }[];
}
