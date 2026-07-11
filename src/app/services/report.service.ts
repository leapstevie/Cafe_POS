import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReportDashboard } from '../models/report.model';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private readonly API_URL = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) { }

    getDashboard(days: number = 14): Observable<ReportDashboard> {
        return this.http.get<ReportDashboard>(`${this.API_URL}/dashboard`, {
            params: { days }
        });
    }
}
