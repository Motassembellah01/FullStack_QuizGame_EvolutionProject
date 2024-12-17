import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { Chart } from 'chart.js/auto';
import { HistogramComponent } from './histogram.component';

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let chartSpy: jasmine.SpyObj<Chart>;

    beforeEach(() => {
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['setupListeners', 'createChart', 'isShowingQuestionResults']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, HistogramComponent],
            providers: [
                { provide: HistogramService, useValue: histogramServiceSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
    });

    describe('creation', () => {
        it('should create', () => {
            fixture.detectChanges();
            expect(component).toBeTruthy();
        });

        it('should call setupListeners and createChart', () => {
            chartSpy = jasmine.createSpyObj({ destroy: null });
            histogramServiceSpy.chart = chartSpy;
            histogramServiceSpy.isShowingQuestionResults = false;
            histogramServiceSpy.createChart.and.stub();
            fixture.detectChanges();
            expect(histogramServiceSpy.setupListeners).toHaveBeenCalled();
        });

        it('should destroy chart if chart with the same id already exists', () => {
            chartSpy = jasmine.createSpyObj({ destroy: null });
            histogramServiceSpy.chart = chartSpy;
            histogramServiceSpy.isShowingQuestionResults = false;
            fixture.detectChanges();
            expect(histogramServiceSpy.chart.destroy).toHaveBeenCalled();
        });

        it('should not call chart.destroy if isShowingQuestionResults is true', () => {
            chartSpy = jasmine.createSpyObj({ destroy: null });
            histogramServiceSpy.chart = chartSpy;
            histogramServiceSpy.isShowingQuestionResults = true;
            fixture.detectChanges();
            expect(histogramServiceSpy.chart.destroy).not.toHaveBeenCalled();
        });

        it('onResize destroy and recreate chart', () => {
            chartSpy = jasmine.createSpyObj({ destroy: null });
            histogramServiceSpy.chart = chartSpy;
            component.onResize();
            expect(histogramServiceSpy.createChart).toHaveBeenCalled();
            expect(histogramServiceSpy.chart.destroy).toHaveBeenCalled();
        });
    });
});
