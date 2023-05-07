import { Component, OnInit, VERSION, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BackupFormWithStateDirective } from './directives/backup-form-with-state.directive';
import { timer } from 'rxjs';

const TIME_DELAY_LOAD_BACKUP = 1500;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
 @ViewChild(BackupFormWithStateDirective, {static: true}) backupFormWithStateRef!: BackupFormWithStateDirective;
  backupForm!: FormGroup;

  constructor(private fb: FormBuilder) {
   
  }

  ngOnInit() {
    this.buildForm();
    this.initializeBackupForm();
  }

  buildForm() {
    this.backupForm = this.fb.group({
      backupId: [new Date().getDate().toString(), []],
      name: ['', []],
      options: ['', []],
      content: ['', []],
      salary: [0,[]],
    });
  }

  initializeBackupForm(){
    timer(TIME_DELAY_LOAD_BACKUP).subscribe(()=>{
      this.backupFormWithStateRef.setInitialState(this.backupForm.value);
      this.backupFormWithStateRef.initializeForm();
    });
  }

  cleanBackupForm(){
    this.backupFormWithStateRef?.removeBackupData();
  }

  resetForm(){
    this.backupForm.patchValue({name: '', options: '', content: '', salary: 0})
  }

  save(){
    this.resetForm();
    this.cleanBackupForm();
    this.backupFormWithStateRef.resetBackupCheck(this.backupForm.value);
  }

  leave(){
    if(!this.backupFormWithStateRef){ return; }
    if(!this.backupFormWithStateRef.existsBackup){return; }

    const leave = confirm('¿Estas seguro que desesas salir sin guardar los cambios?')
    if(leave){
      this.save();
    }
  }
}
