import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
    selector: 'app-order-history',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './order-history.component.html',
    styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
    orders: Order[] = [];
    selectedOrder: Order | null = null;
    isLoading = false;
    isLoadingDetail = false;
    errorMessage = '';

    constructor(private readonly orderService: OrderService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {
        this.isLoading = true;
        this.orderService.getAllOrders().subscribe({
            next: (data) => {
                this.orders = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.errorMessage = err.message || 'Failed to load orders';
                this.isLoading = false;
            }
        });
    }

    viewOrder(id: number): void {
        if (this.selectedOrder?.id === id) {
            this.selectedOrder = null;
            return;
        }
        this.isLoadingDetail = true;
        this.orderService.getOrderById(id).subscribe({
            next: (order) => {
                this.selectedOrder = order;
                this.isLoadingDetail = false;
            },
            error: () => {
                this.isLoadingDetail = false;
            }
        });
    }

    get totalRevenue(): number {
        return this.orders.reduce((sum, o) => sum + +o.total, 0);
    }
}
