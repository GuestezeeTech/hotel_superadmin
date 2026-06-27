import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiryDetailsComponent } from './expiry-details.component';

describe('ExpiryDetailsComponent', () => {
  let component: ExpiryDetailsComponent;
  let fixture: ComponentFixture<ExpiryDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpiryDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpiryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
