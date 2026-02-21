import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookPreview } from './facebook-preview';

describe('FacebookPreview', () => {
  let component: FacebookPreview;
  let fixture: ComponentFixture<FacebookPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacebookPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
