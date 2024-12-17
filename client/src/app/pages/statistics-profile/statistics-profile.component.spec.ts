import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsProfileComponent } from './statistics-profile.component';

describe('StatisticsProfileComponent', () => {
  let component: StatisticsProfileComponent;
  let fixture: ComponentFixture<StatisticsProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatisticsProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
