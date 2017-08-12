import { NgModule } from '@angular/core';

import {MapComponent} from './map/map.component';
import {CommonModule} from '@angular/common';
import { SliderComponent } from './map/slider/slider.component';

@NgModule({
  declarations: [
    MapComponent,
    SliderComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [MapComponent, SliderComponent]
})
export class D3ChoroplethMapModule { }
