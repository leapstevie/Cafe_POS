import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DatasetComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { ReportService } from '../../services/report.service';
import { ReportDashboard } from '../../models/report.model';

echarts.use([
    LineChart,
    BarChart,
    PieChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DatasetComponent,
    CanvasRenderer
]);

// Validated categorical palette, fixed order (see dataviz skill palette.md)
const CATEGORY_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
const BLUE = '#2a78d6';
const MUTED_INK = '#898781';
const SECONDARY_INK = '#52514e';
const GRIDLINE = '#e1e0d9';
const SURFACE = '#ffffff';

@Component({
    selector: 'app-analysis-report',
    standalone: true,
    imports: [CommonModule, RouterModule, NgxEchartsDirective],
    providers: [provideEchartsCore({ echarts })],
    templateUrl: './analysis-report.component.html',
    styleUrl: './analysis-report.component.css'
})
export class AnalysisReportComponent implements OnInit {
    dashboard: ReportDashboard | null = null;
    isLoading = false;
    errorMessage = '';
    selectedRange = 14;
    readonly rangeOptions = [7, 14, 30, 90];

    revenueTrendOption: EChartsCoreOption = {};
    ordersTrendOption: EChartsCoreOption = {};
    topItemsOption: EChartsCoreOption = {};
    categorySalesOption: EChartsCoreOption = {};
    paymentMethodsOption: EChartsCoreOption = {};
    cashierPerformanceOption: EChartsCoreOption = {};

    constructor(private readonly reportService: ReportService) { }

    ngOnInit(): void {
        this.loadDashboard();
    }

    selectRange(days: number): void {
        if (days === this.selectedRange) {
            return;
        }
        this.selectedRange = days;
        this.loadDashboard();
    }

    loadDashboard(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.reportService.getDashboard(this.selectedRange).subscribe({
            next: (data) => {
                this.dashboard = data;
                this.buildCharts(data);
                this.isLoading = false;
            },
            error: (err) => {
                this.errorMessage = err.error?.error || 'Failed to load analysis report';
                this.isLoading = false;
            }
        });
    }

    private buildCharts(data: ReportDashboard): void {
        const dates = data.salesTrend.map(p => this.formatShortDate(p.date));

        this.revenueTrendOption = {
            color: [BLUE],
            tooltip: { trigger: 'axis', valueFormatter: (v: number) => `$${Number(v).toFixed(2)}` },
            grid: { left: 56, right: 16, top: 24, bottom: 32 },
            xAxis: {
                type: 'category',
                data: dates,
                axisTick: { show: false },
                axisLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: MUTED_INK }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: MUTED_INK, formatter: '${value}' }
            },
            series: [{
                name: 'Revenue',
                type: 'line',
                data: data.salesTrend.map(p => Number(p.revenue.toFixed(2))),
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { width: 2, color: BLUE },
                itemStyle: { color: BLUE },
                areaStyle: { color: 'rgba(42,120,214,0.08)' }
            }]
        };

        this.ordersTrendOption = {
            color: [BLUE],
            tooltip: { trigger: 'axis' },
            grid: { left: 40, right: 16, top: 24, bottom: 32 },
            xAxis: {
                type: 'category',
                data: dates,
                axisTick: { show: false },
                axisLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: MUTED_INK }
            },
            yAxis: {
                type: 'value',
                minInterval: 1,
                splitLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: MUTED_INK }
            },
            series: [{
                name: 'Orders',
                type: 'bar',
                data: data.salesTrend.map(p => p.orders),
                barMaxWidth: 28,
                itemStyle: { color: BLUE, borderRadius: [4, 4, 0, 0] }
            }]
        };

        const topItems = [...data.topItems].reverse();
        this.topItemsOption = {
            color: [BLUE],
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `$${Number(v).toFixed(2)}` },
            grid: { left: 120, right: 24, top: 16, bottom: 24 },
            xAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: MUTED_INK, formatter: '${value}' }
            },
            yAxis: {
                type: 'category',
                data: topItems.map(i => i.itemName),
                axisTick: { show: false },
                axisLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: SECONDARY_INK }
            },
            series: [{
                name: 'Revenue',
                type: 'bar',
                data: topItems.map(i => Number(i.revenue.toFixed(2))),
                barMaxWidth: 20,
                itemStyle: { color: BLUE, borderRadius: [0, 4, 4, 0] }
            }]
        };

        this.categorySalesOption = this.buildPieOption(
            data.categorySales.map(c => ({ name: c.category, value: Number(c.revenue.toFixed(2)) }))
        );

        this.paymentMethodsOption = this.buildPieOption(
            data.paymentMethods.map(p => ({ name: p.paymentMethod, value: Number(p.revenue.toFixed(2)) }))
        );

        const cashiers = [...data.cashierPerformance].reverse();
        this.cashierPerformanceOption = {
            color: [BLUE],
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `$${Number(v).toFixed(2)}` },
            grid: { left: 96, right: 24, top: 16, bottom: 24 },
            xAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: MUTED_INK, formatter: '${value}' }
            },
            yAxis: {
                type: 'category',
                data: cashiers.map(c => c.cashier),
                axisTick: { show: false },
                axisLine: { lineStyle: { color: GRIDLINE } },
                axisLabel: { color: SECONDARY_INK }
            },
            series: [{
                name: 'Revenue',
                type: 'bar',
                data: cashiers.map(c => Number(c.revenue.toFixed(2))),
                barMaxWidth: 20,
                itemStyle: { color: BLUE, borderRadius: [0, 4, 4, 0] }
            }]
        };
    }

    private buildPieOption(items: { name: string; value: number }[]): EChartsCoreOption {
        return {
            color: CATEGORY_COLORS,
            tooltip: { trigger: 'item', valueFormatter: (v: number) => `$${Number(v).toFixed(2)}` },
            legend: {
                bottom: 0,
                left: 'center',
                textStyle: { color: SECONDARY_INK }
            },
            series: [{
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                itemStyle: { borderColor: SURFACE, borderWidth: 2 },
                label: { color: SECONDARY_INK, formatter: '{b}\n{d}%' },
                data: items
            }]
        };
    }

    private formatShortDate(isoDate: string): string {
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
