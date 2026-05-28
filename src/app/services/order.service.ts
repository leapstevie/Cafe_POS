import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, CreateOrderRequest } from '../models/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly API_URL = `${environment.apiUrl}/orders`;

    constructor(private http: HttpClient) { }

    createOrder(order: CreateOrderRequest): Observable<{ message: string; order: Order }> {
        return this.http.post<{ message: string; order: Order }>(this.API_URL, order);
    }

    getAllOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(this.API_URL);
    }

    getOrderById(id: number): Observable<Order> {
        return this.http.get<Order>(`${this.API_URL}/${id}`);
    }
}
