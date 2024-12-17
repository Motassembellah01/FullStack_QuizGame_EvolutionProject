import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetAvatarComponent } from './set-avatar.component';

describe('SetAvatarPageComponent', () => {
  let component: SetAvatarComponent;
  let fixture: ComponentFixture<SetAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetAvatarComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SetAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
