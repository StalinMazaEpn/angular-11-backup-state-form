export interface BackupState {
  data: any;
  id: any;
  createdAt: number;
}

export const saveFormState = (id: any, groupname: string, data: any) => {
  try {
    // 1) find list preselection: [{data, id, createdAt}, ...]
    const backupObjects: string | null = localStorage.getItem(groupname);
    let backupList: BackupState[] = [];
    if (backupObjects) {
      backupList = JSON.parse(backupObjects);
    }
    // 2) find by id: candidate
    const backupItemIndex = backupList.findIndex((i) => i.id === id);
    // create backup
    const backupItem = { data, id, createdAt: new Date().getTime() };
    // 3) if not exist: create
    if (backupItemIndex < 0) {
      backupList.unshift(backupItem);
    } else {
      // replace
      backupList.splice(backupItemIndex, 1, backupItem);
    }
    // 4) save backup
    localStorage.setItem(groupname, JSON.stringify(backupList));
    // 5) delete item on save
  } catch (err) {
    console.error(err);
  }
};
export const existsFormState = (id: any, groupname: string) => {
  try {
    // 1) find list preselection: [{data, id, createdAt}, ...]
    const backupObjects: string | null = localStorage.getItem(groupname);
    let backupList: BackupState[] = [];
    if (!backupObjects) {
      return false;
    }
    backupList = JSON.parse(backupObjects);
    // 2) find by id: candidate
    const backupItemIndex = backupList.findIndex((i) => i.id === id);
    // create backup
    // 3) if not exist
    if (backupItemIndex < 0) {
      return false;
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
export const getFormState = (id: any, groupname: string) => {
  try {
    // 1) find list preselection: [{data, id, createdAt}, ...]
    const backupObjects: string | null = localStorage.getItem(groupname);
    let backupList: BackupState[] = [];
    if (!backupObjects) {
      return null;
    }
    backupList = JSON.parse(backupObjects);
    // 2) find by id: candidate
    const backupItemIndex = backupList.findIndex((i) => i.id === id);
    // create backup
    // 3) if not exist
    if (backupItemIndex < 0) {
      return null;
    }
    return backupList[backupItemIndex];
  } catch (err) {
    console.error(err);
    return null;
  }
};
export const removeFormState = (id: any, groupname: string): void => {
  try {
    // 1) find list preselection: [{data, id, createdAt}, ...]
    const backupObjects: string | null = localStorage.getItem(groupname);
    let backupList: BackupState[] = [];
    if (!backupObjects) {
      return;
    }
    backupList = JSON.parse(backupObjects);
    // 2) find by id: candidate
    const backupItemIndex = backupList.findIndex((i) => i.id === id);
    // create backup
    // 3) if not exist
    if (backupItemIndex < 0) {
      return;
    }
    backupList.splice(backupItemIndex, 1);
    localStorage.setItem(groupname, JSON.stringify(backupList));
  } catch (err) {
    console.error(err);
    return;
  }
};
