import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionInputComponent } from './transaction-input.component';

describe('TransactionInputComponent', () => {
  let component: TransactionInputComponent;
  let fixture: ComponentFixture<TransactionInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
