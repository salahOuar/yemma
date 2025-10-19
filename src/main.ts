import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { AppComponent } from './app/app.component';



bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter([]),
    importProvidersFrom(MatNativeDateModule)
  ]
}).catch(err => console.error(err));
