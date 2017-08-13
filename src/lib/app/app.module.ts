import { NgModule } from '@angular/core';

import {MapComponent} from './map/map.component';
import {CommonModule} from '@angular/common';
import { SliderComponent } from './map/slider/slider.component';
import { MapControlComponent } from './map/map-control/map-control.component';
import {GMapModule} from 'primeng/primeng';
import {YagaModule} from '@yaga/leaflet-ng2';
// import { LeafletModule } from '@asymmetrik/angular2-leaflet';

@NgModule({
  declarations: [
    MapComponent,
    SliderComponent,
    MapControlComponent
  ],
  imports: [
    CommonModule,
    GMapModule,
    YagaModule
  ],
  exports: [MapComponent, SliderComponent]
})
export class D3ChoroplethMapModule { }
