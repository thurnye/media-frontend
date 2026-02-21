import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceHome } from './workspace-home';

describe('WorkspaceHome', () => {
  let component: WorkspaceHome;
  let fixture: ComponentFixture<WorkspaceHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
