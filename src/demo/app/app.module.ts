import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { D3ChoroplethMapModule } from '../../lib/app/app.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    D3ChoroplethMapModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
