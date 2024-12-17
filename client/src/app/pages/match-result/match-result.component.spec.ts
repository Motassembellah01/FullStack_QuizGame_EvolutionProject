import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Player } from '@app/core/interfaces/player';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatComponent } from '@app/shared/components/chat/chat.component';
import { HistogramComponent } from '@app/shared/components/histogram/histogram.component';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { PlayersListComponent } from '@app/shared/components/players-list/players-list.component';
import { Chart } from 'chart.js/auto';
import { MatchResultComponent } from './match-result.component';
import { CommonModule } from '@angular/common';

describe('MatchResultComponent', () => {
    let component: MatchResultComponent;
    let fixture: ComponentFixture<MatchResultComponent>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let chartSpy: jasmine.SpyObj<Chart>;

    beforeEach(() => {
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', ['cleanCurrentMatch', 'initializePlayersList']);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', [
            'createChart',
            'isShowingQuestionResults',
            'isShowingMatchResults',
            'questionsStats',
            'currentChartIndex',
            'questionsChartData',
            'setupListeners',
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

        TestBed.configureTestingModule({
            declarations: [],
            imports: [
                AppMaterialModule,
                FormsModule,
                MatchResultComponent,
                PlayersListComponent,
                ChatComponent,
                LogoComponent,
                HistogramComponent,
                CommonModule,
            ],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: HistogramService, useValue: histogramServiceSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(MatchResultComponent);
        matchPlayerServiceSpy.dataSource = new MatTableDataSource<Player>();
        matchPlayerServiceSpy.router = routerSpy;
        component = fixture.componentInstance;
    });

    describe('creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should call redirectToHome onpopstate', () => {
            const redirectToHomeSpy = spyOn(component, 'redirectToHome').and.stub();
            component.ngOnInit();
            window.dispatchEvent(new Event('popstate'));
            expect(redirectToHomeSpy).toHaveBeenCalled();
        });

        it('should call redirectToHome on onbeforeunload event', () => {
            spyOn(component, 'redirectToHome').and.stub();
            component.ngOnInit();
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.redirectToHome).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should not call redirectToHome on onbeforeunload event after component destruction', () => {
            spyOn(component, 'redirectToHome').and.stub();
            component.ngOnDestroy();
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.redirectToHome).not.toHaveBeenCalled();
        });

        it('should call redirectToHome on onpopstate event after component destruction', () => {
            spyOn(component, 'redirectToHome').and.stub();
            component.ngOnDestroy();
            window.dispatchEvent(new Event('popstate'));
            expect(component.redirectToHome).not.toHaveBeenCalled();
        });
    });

    describe('redirectToHome', () => {
        it('should call cleanCurrentMatch and navigateByUrl and set isShowingMatchResults to false', () => {
            component.redirectToHome();
            expect(histogramServiceSpy.isShowingMatchResults).toEqual(false);
            expect(matchPlayerServiceSpy.cleanCurrentMatch).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalled();
        });
    });

    describe('onShowPreviousChart', () => {
        it('should call chart.destroy and createChart', () => {
            chartSpy = jasmine.createSpyObj({ destroy: null });
            histogramServiceSpy.chart = chartSpy;
            component.onShowPreviousChart();
            expect(histogramServiceSpy.createChart).toHaveBeenCalled();
            expect(histogramServiceSpy.chart.destroy).toHaveBeenCalled();
        });
    });

    describe('onShowNextChart', () => {
        it('should call chart.destroy and createChart', () => {
            chartSpy = jasmine.createSpyObj({ destroy: null });
            histogramServiceSpy.chart = chartSpy;
            component.onShowNextChart();
            expect(histogramServiceSpy.createChart).toHaveBeenCalled();
            expect(histogramServiceSpy.chart.destroy).toHaveBeenCalled();
        });
    });
});
