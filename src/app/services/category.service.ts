import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private readonly API_URL = `${environment.apiUrl}/categories`;

    constructor(private http: HttpClient) { }

    /**
     * Get all categories
     */
    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.API_URL);
    }

    /**
     * Create new category
     */
    createCategory(category: Category): Observable<any> {
        return this.http.post(this.API_URL, category);
    }

    /**
     * Update category
     */
    updateCategory(id: number, category: Category): Observable<any> {
        return this.http.put(`${this.API_URL}/${id}`, category);
    }

    /**
     * Delete category
     */
    deleteCategory(id: number): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`);
    }
}
