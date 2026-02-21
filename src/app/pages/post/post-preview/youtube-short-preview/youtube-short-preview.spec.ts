import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubeShortPreview } from './youtube-short-preview';

describe('YoutubeShortPreview', () => {
  let component: YoutubeShortPreview;
  let fixture: ComponentFixture<YoutubeShortPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubeShortPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YoutubeShortPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
