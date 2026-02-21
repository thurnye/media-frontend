import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicktokPreview } from './ticktok-preview';

describe('TicktokPreview', () => {
  let component: TicktokPreview;
  let fixture: ComponentFixture<TicktokPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicktokPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicktokPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
