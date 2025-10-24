import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideDetail } from './side-detail';

describe('SideDetail', () => {
  let component: SideDetail;
  let fixture: ComponentFixture<SideDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
