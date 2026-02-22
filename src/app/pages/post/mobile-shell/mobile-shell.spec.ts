import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileShell } from './mobile-shell';

describe('MobileShell', () => {
  let component: MobileShell;
  let fixture: ComponentFixture<MobileShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
