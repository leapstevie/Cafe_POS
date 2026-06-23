import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
    selector: 'app-order-history',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './order-history.component.html',
    styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
    orders: Order[] = [];
    selectedOrder: Order | null = null;
    isLoading = false;
    isLoadingDetail = false;
    errorMessage = '';

    // Filter properties
    searchQuery: string = '';
    filterDate: string = '';
    filterCashier: string = '';

    constructor(private readonly orderService: OrderService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {
        this.isLoading = true;
        this.orderService.getAllOrders().subscribe({
            next: (data) => {
                this.orders = data.sort((a, b) => {
                    return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
                });
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

    get filteredOrders(): Order[] {
        return this.orders.filter(order => {
            const matchesSearch = !this.searchQuery || 
                order.invoice_number.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (order.cashier_name && order.cashier_name.toLowerCase().includes(this.searchQuery.toLowerCase()));
            
            const matchesDate = !this.filterDate || 
                new Date(order.created_at!).toLocaleDateString('en-CA') === this.filterDate;
            
            const matchesCashier = !this.filterCashier || 
                (order.cashier_name && order.cashier_name.toLowerCase().includes(this.filterCashier.toLowerCase()));

            return matchesSearch && matchesDate && matchesCashier;
        });
    }

    get totalRevenue(): number {
        return this.filteredOrders.reduce((sum, o) => sum + +o.total, 0);
    }

    clearFilters(): void {
        this.searchQuery = '';
        this.filterDate = '';
        this.filterCashier = '';
    }
}
