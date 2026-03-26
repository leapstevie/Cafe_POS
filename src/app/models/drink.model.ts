export interface Drink {
    id?: number;
    name: string;
    category_id: number;
    category?: string; 
    price: number;
    description: string;
    temperature: string;
    image: string;
}

export interface CartItem {
    drink: Drink;
    quantity: number;
    subtotal: number;
}
