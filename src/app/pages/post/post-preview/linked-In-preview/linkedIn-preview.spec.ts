import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkedInPreview } from './linkedInpreview'

describe('LinkedInPreview', () => {
  let component: LinkedInPreview;
  let fixture: ComponentFixture<LinkedInPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkedInPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkedInPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
