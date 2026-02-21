import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinterestPreview } from './pinterest-preview';

describe('PinterestPreview', () => {
  let component: PinterestPreview;
  let fixture: ComponentFixture<PinterestPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinterestPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PinterestPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
