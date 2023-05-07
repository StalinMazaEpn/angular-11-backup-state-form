import {
  Directive,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  existsFormState,
  getFormState,
  removeFormState,
  saveFormState,
} from '../utils/browserStorage';

import {
  StringArrayObject,
  checkDifferencesBetween,
  mapDataFromLocalStorage,
} from '../utils/helpers';
import { DeepCopy } from '../utils/deepCopy';

class BackupUtils {
  static getChanges(
    originalValue: any,
    updatedValue: any,
    excludeFieldsOnCheck: string[],
    keysToCheckPerField: StringArrayObject
  ) {
    return {
      changes: checkDifferencesBetween(originalValue, updatedValue, {
        excludeGlobalKeys: excludeFieldsOnCheck,
        keysToCheckPerField,
      }).result,
      value: updatedValue,
    };
  }
}

interface BackupChange {
  value: any;
  changes: any[];
  originalValue: any;
}
export interface BackupDynamicChanges {
  changesInCreate: BackupChange[];
  changesInEdit: BackupChange[];
}
interface BackupDynamicStateValue {
  existsBackup: boolean;
  canSaveForm: boolean;
}
export interface BackupDynamicStates {
  [key: number]: BackupDynamicStateValue;
}

const DELAY_TIME_FORM_CHANGE = 200;
@Directive({
  selector: '[backupFormWithState]',
})
export class BackupFormWithStateDirective implements OnDestroy {
  @Input() backupFormGroup!: FormGroup;
  @Input() backupFormArray!: FormArray;
  @Input() backupFormName!: string;
  @Input() backupIdentifier: string | number | null = null;
  @Input() backupUniqueIdentifier: string | number = '';
  @Input() backupDynamicIdentifier!: string;
  @Input() excludeFieldsOnSave: string[] = [];
  @Input() excludeFieldsOnLoad: string[] = [];
  @Input() excludeFieldsOnCheck: string[] = [];
  @Input() fieldsObjectToCheck: StringArrayObject = {};
  @Input() isEdit = false;

  subscriptionsComponent: Subscription[] = [];

  @Output() onLoadedBackupData = new EventEmitter();
  @Output() onFormArrayStatesChanged = new EventEmitter<BackupDynamicStates>();

  private backupExits = false;
  private backupFormCanBeSaved = false;
  private initialBackupState: any = {};
  private backupId: string = '';

  constructor() {}

  ngOnInit() {
    this.checkBackupId();
  }

  ngOnDestroy() {
    this.subscriptionsComponent.forEach((suscription: Subscription) =>
      suscription.unsubscribe()
    );
  }

  initializeForm() {
    this.loadBackupForm();
    this.onChangeForm();
  }

  resetBackupCheck(initialValue){
    this.setInitialState(initialValue)
     this.loadBackupForm();
     //this.
  }

  initializeFormArrayStates() {
    this.loadBackupFormArray();
    this.onChangeFormArray();
  }

  setInitialState(body: any) {
    this.initialBackupState = (body != null && body) != undefined ? body : {};
  }

  setInitialStateFormArray(body: any[]) {
    this.initialBackupState = (body != null && body) != undefined ? body : [];
  }

  getInitialState() {
    const initialStateKeys = Object.keys(this.initialBackupState);
    const initialStateResult: any = {};

    for (let i = 0; i < initialStateKeys.length; i++) {
      const parentKey = initialStateKeys[i];
      initialStateResult[parentKey] = DeepCopy.copy(
        this.initialBackupState[parentKey]
      );
    }
    return initialStateResult;
  }

  getInitialStateArray() {
    const initialStateResult = this.initialBackupState.map((r: any) => {
      const initialStateKeys = Object.keys(r);
      const resultObj: any = {};
      for (let i = 0; i < initialStateKeys.length; i++) {
        const parentKey = initialStateKeys[i];
        resultObj[parentKey] = DeepCopy.copy(r[parentKey]);
      }
      return resultObj;
    });
    return initialStateResult;
  }

  checkBackupId() {
    this.backupId = this.isEdit
      ? this.backupIdentifier
        ? this.backupIdentifier.toString()
        : ''
      : `${this.backupFormName}_create`;
  }

  getBackupFormChanges(
    backupId: string,
    backupFormName: string,
    initialBackupState: any
  ): BackupChange {
    if (!existsFormState(backupId, backupFormName)) {
      return { value: null, changes: [], originalValue: null };
    }
    let formValue: any = mapDataFromLocalStorage({
      ...getFormState(backupId, backupFormName)?.data,
    });
    const initialBackupStateFinal = DeepCopy.copy(initialBackupState);
    //Check if value saved in LS is different from the Api Data
    let value = DeepCopy.copy(formValue);
    let originalValue = DeepCopy.copy(formValue);
    //Exclude fields on load
    for (const excludeField of this.excludeFieldsOnLoad) {
      delete value[excludeField];
    }

    return {
      changes: checkDifferencesBetween(initialBackupStateFinal, formValue, {
        excludeGlobalKeys: this.excludeFieldsOnCheck,
        keysToCheckPerField: this.fieldsObjectToCheck,
      }).result,
      value: value,
      originalValue,
    };
  }

  loadBackupForm() {
    //Check if value saved in LS is different from the Api Data
    if (existsFormState(this.backupId, this.backupFormName)) {
      const backupChanges = this.getBackupFormChanges(
        this.backupId,
        this.backupFormName,
        this.initialBackupState
      );
      const diffWithInitialState = backupChanges.changes;
      if (Object.keys(diffWithInitialState).length > 0) {
        this.backupFormGroup.patchValue(backupChanges.value, {
          emitEvent: false,
        });
        this.onLoadedBackupData.emit(backupChanges);
        this.backupExits = true;
        this.backupFormCanBeSaved = true;
      } else {
        removeFormState(this.backupId, this.backupFormName);
        this.backupExits = false;
        this.backupFormCanBeSaved = false;
      }
    } else {
      this.backupFormCanBeSaved = this.isEdit ? false : true;
      this.backupExits = false;
    }
  }

  loadBackupFormArray() {
    //Check if value saved in LS is different from the Api Data
    let changesInEdit: any = [];
    let changesInCreate: any = [];
    if (existsFormState(this.backupId, this.backupFormName)) {
      const valueFromLocalStorage =
        getFormState(this.backupId, this.backupFormName)?.data || [];
      let formValue = valueFromLocalStorage.map((r: any) =>
        mapDataFromLocalStorage(r)
      );
      for (const formItem of formValue) {
        if (
          this.backupDynamicIdentifier in formItem &&
          formItem[this.backupDynamicIdentifier] != null &&
          formItem != undefined
        ) {
          const initialStateFound = this.initialBackupState.filter(
            (r: any) =>
              r[this.backupDynamicIdentifier] ===
              formItem[this.backupDynamicIdentifier]
          );
          if (initialStateFound.length > 0) {
            const changesDifferences = checkDifferencesBetween(
              initialStateFound[0],
              formItem,
              {
                excludeGlobalKeys: this.excludeFieldsOnCheck,
                keysToCheckPerField: this.fieldsObjectToCheck,
              }
            ).result;
            if (Object.keys(changesDifferences).length > 0) {
              changesInEdit.push({
                changes: changesDifferences,
                value: formItem,
                originalValue: initialStateFound[0],
              });
            }
          }
        } else {
          changesInCreate.push({
            changes: null,
            value: formItem,
            originalValue: formItem,
          });
        }
      }
    }
    this.onLoadedBackupData.emit({ changesInEdit, changesInCreate });
  }

  loadInitialFormArrayStates() {
    const changesAndStateResult = this.checkFormArrayChangesAndStates();
    this.onFormArrayStatesChanged.emit(changesAndStateResult.states);
  }
  checkFormArrayChangesAndStates() {
    let formValueArray = this.backupFormArray.value || [];
    let formValueArrayToSave: any[] = [];
    let formValueStates: any = {};
    for (let index = 0; index < formValueArray.length; index++) {
      const formItem = DeepCopy.copy(formValueArray[index]);
      //Check form items is edit or create
      const formItemToSave = DeepCopy.copy(formItem);
      for (const keySaveRemove of this.excludeFieldsOnSave) {
        delete formItem[keySaveRemove];
      }
      for (const keySaveRemove of this.excludeFieldsOnSave) {
        delete formItemToSave[keySaveRemove];
      }
      if (
        this.backupDynamicIdentifier in formItem &&
        formItem[this.backupDynamicIdentifier] != null &&
        formItem != undefined
      ) {
        const initialStateFound = this.initialBackupState.filter(
          (r: any) =>
            r[this.backupDynamicIdentifier] ===
            formItem[this.backupDynamicIdentifier]
        );
        if (initialStateFound.length > 0) {
          const changesDifferences = checkDifferencesBetween(
            initialStateFound[0],
            formItemToSave,
            {
              excludeGlobalKeys: this.excludeFieldsOnCheck,
              keysToCheckPerField: this.fieldsObjectToCheck,
            }
          ).result;
          if (Object.keys(changesDifferences).length > 0) {
            formValueStates[index] = {
              existsBackup: true,
              canSaveForm: true,
            };
            formValueArrayToSave.push(formItemToSave);
            continue;
          } else {
            formValueStates[index] = {
              existsBackup: false,
              canSaveForm: this.backupFormArray.at(index)?.valid ? false : true,
            };
            continue;
          }
        }
        formValueStates[index] = {
          existsBackup: false,
          canSaveForm: false,
        };
        continue;
      } else {
        formValueStates[index] = {
          existsBackup: true,
          canSaveForm: true,
        };
        formValueArrayToSave.push(formItem);
        continue;
      }
    }
    return {
      result: formValueArrayToSave,
      states: formValueStates,
    };
  }
  onChangeFormArray() {
    if (this.backupFormName) {
      const changesAndStateResult = this.checkFormArrayChangesAndStates();
      saveFormState(
        this.backupId,
        this.backupFormName,
        changesAndStateResult.result
      );
      this.onFormArrayStatesChanged.emit(changesAndStateResult.states);
    }
  }

  removeBackupData() {
    removeFormState(this.backupId, this.backupFormName);
  }

  removeBackupDataEmpty(): void {
    if (existsFormState(this.backupId, this.backupFormName)) {
      const dataSaved =
        getFormState(this.backupId, this.backupFormName)?.data || [];
      if (dataSaved.length === 0) {
        this.removeBackupData();
      }
    }
  }

  checkBackupExist() {
    this.backupExits = existsFormState(this.backupId, this.backupFormName)
      ? true
      : false;
  }

  removeBackupDataDynamic(
    staticIdentifier: string | number,
    dynamicIdentifier: string | number,
    isEdit: boolean
  ) {
    if (existsFormState(this.backupId, this.backupFormName)) {
      const valueFromLocalStorage =
        getFormState(this.backupId, this.backupFormName)?.data || [];
      const dataDynamicInStorage = valueFromLocalStorage.map((r: any) =>
        mapDataFromLocalStorage(r)
      );
      if (isEdit) {
        const dataAfterRemove = dataDynamicInStorage.filter(
          (r: any) => r[this.backupDynamicIdentifier] !== staticIdentifier
        );
        saveFormState(this.backupId, this.backupFormName, dataAfterRemove);
      } else {
        const dataAfterRemove = dataDynamicInStorage.filter(
          (r: any) => r[this.backupUniqueIdentifier] !== dynamicIdentifier
        );
        saveFormState(this.backupId, this.backupFormName, dataAfterRemove);
      }
      this.removeBackupDataEmpty();
      const changesAndStateResult = this.checkFormArrayChangesAndStates();
      this.onFormArrayStatesChanged.emit(changesAndStateResult.states);
    }
  }

  private onChangeForm() {
    if (this.backupFormName) {
      const suscriptionFormChange = this.backupFormGroup.valueChanges
        .pipe(debounceTime(DELAY_TIME_FORM_CHANGE))
        .subscribe((formValue) => {
          console.log('formValue onchage', formValue)
          const val = DeepCopy.copy(formValue);
          const excludeFieldsOnSave = this.excludeFieldsOnSave.filter(
            (r) => r.length > 0
          );
          //Exclude fields on save
          for (const excludeField of excludeFieldsOnSave) {
            delete val[excludeField];
          }
          //Check form has changed to save data in LS
          const changesComparison = BackupUtils.getChanges(
            this.initialBackupState,
            formValue,
            this.excludeFieldsOnCheck,
            this.fieldsObjectToCheck
          );
          const diffWithInitialState = changesComparison.changes;
          if (Object.keys(diffWithInitialState).length > 0) {
            saveFormState(this.backupId, this.backupFormName, val);
            this.backupExits = true;
          } else {
            removeFormState(this.backupId, this.backupFormName);
            this.backupExits = false;
          }

          if (this.backupFormGroup.valid) {
            this.backupFormCanBeSaved = this.existsBackup ? true : false;
          } else {
            this.backupFormCanBeSaved = true;
          }
        });
      this.subscriptionsComponent.push(suscriptionFormChange);
    }
  }

  get existsBackup() {
    return this.backupExits;
  }
  get canSaveForm() {
    return this.backupFormCanBeSaved;
  }
}
