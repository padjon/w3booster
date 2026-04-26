import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MapbarComponent } from './mapbar/mapbar.component';
import { MatchbarComponent } from './matchbar/matchbar.component';
import { ObsMatchbarComponent } from './obs-matchbar/obs-matchbar.component';
import { ObsMatchbar4v4Component } from './obs-matchbar-4v4/obs-matchbar-4v4.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { KeysPipe } from './pipes';
import { IngameOverlayService } from './services/ingame-overlay.service';


@NgModule({ declarations: [
        AppComponent,
        MapbarComponent,
        MatchbarComponent,
        ObsMatchbarComponent,
        ObsMatchbar4v4Component,
        KeysPipe
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule], providers: [IngameOverlayService, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
