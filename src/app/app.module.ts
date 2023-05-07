import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { BackupFormWithStateDirective } from './directives/backup-form-with-state.directive';

@NgModule({
  imports: [BrowserModule, FormsModule, ReactiveFormsModule],
  declarations: [AppComponent, HelloComponent, BackupFormWithStateDirective],
  bootstrap: [AppComponent],
})
export class AppModule {}
