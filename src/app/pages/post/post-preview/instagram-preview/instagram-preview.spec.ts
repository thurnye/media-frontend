import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstagramPreview } from './instagram-preview';

describe('InstagramPreview', () => {
  let component: InstagramPreview;
  let fixture: ComponentFixture<InstagramPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstagramPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstagramPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
