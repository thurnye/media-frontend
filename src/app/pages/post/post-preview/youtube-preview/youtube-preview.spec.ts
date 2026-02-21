import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubePreview } from './youtube-preview';

describe('YoutubePreview', () => {
  let component: YoutubePreview;
  let fixture: ComponentFixture<YoutubePreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubePreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YoutubePreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
