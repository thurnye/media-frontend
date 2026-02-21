import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwitterPreview } from './twitter-preview';

describe('TwitterPreview', () => {
  let component: TwitterPreview;
  let fixture: ComponentFixture<TwitterPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwitterPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwitterPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
