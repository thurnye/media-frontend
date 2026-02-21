import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadPreview } from './thread-preview';

describe('ThreadPreview', () => {
  let component: ThreadPreview;
  let fixture: ComponentFixture<ThreadPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
