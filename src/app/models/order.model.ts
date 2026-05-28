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
    total: number;
    payment_status: string;
    cashier_name: string;
    created_at?: string;
    items?: OrderItem[];
}

export interface CreateOrderRequest {
    total: number;
    cashier_name: string;
    items: {
        item_id: number | null;
        item_name: string;
        quantity: number;
        subtotal: number;
    }[];
}
