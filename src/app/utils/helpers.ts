import { DeepCopy } from './deepCopy';
import { diff as deepObjectDiff } from 'deep-object-diff';
import * as textDiff from 'diff';

const regexDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

interface StringArrayObject {
  [key: string]: string[];
}

interface ICheckObjectDiffConfig {
  excludeGlobalKeys: string[];
  keysToCheckPerField: StringArrayObject;
}

function mapDataFromLocalStorage(valueToMap: any) {
  const valueObj = DeepCopy.copy(valueToMap);
  for (const prop in valueObj) {
    const propValue = valueObj[prop];
    if (typeof propValue == 'string') {
      if (!isNaN(Date.parse(valueObj[prop]))) {
        if (regexDatePattern.test(valueObj[prop])) {
          valueObj[prop] = new Date(
            Date.parse(valueObj[prop].replace('T', ' '))
          );
        }
      }
    }
  }
  return valueObj;
}

function cleanKeysFromObject(originalValue: any, keysAllowed: string[]) {
  const returnValue = DeepCopy.copy(originalValue);
  for (const key in returnValue) {
    if (Object.prototype.hasOwnProperty.call(returnValue, key)) {
      if (!keysAllowed.includes(key)) {
        delete returnValue[key];
      }
    }
  }
  return returnValue;
}

function isPureObject(input: any): boolean {
  return (
    null !== input &&
    typeof input === 'object' &&
    Object.getPrototypeOf(input).isPrototypeOf(Object)
  );
}

function checkDateTextIsValid(dateInText: string) {
  if (isNaN(Date.parse(dateInText))) {
    return false;
  }
  if (regexDatePattern.test(dateInText)) {
    return true;
  }
  return false;
}

function cleanAndValidateObject(objectToCheck: any) {
  const differenceKeys = Object.keys(objectToCheck);
  const objectFixed: any = {};
  for (let i = 0; i < differenceKeys.length; i++) {
    const parentKey = differenceKeys[i];
    if (typeof objectToCheck[parentKey] == 'string') {
      if (
        objectToCheck[parentKey].trim() !== '' &&
        objectToCheck[parentKey].trim() !== 'undefined'
      ) {
        if (checkDateTextIsValid(objectToCheck[parentKey])) {
          objectToCheck[parentKey] = new Date(
            Date.parse(objectToCheck[parentKey].replace('T', ' '))
          );
        }
        objectFixed[parentKey] = DeepCopy.copy(objectToCheck[parentKey]);
      }
    } else if (objectToCheck[parentKey] === undefined) {
      continue;
    } else if (Array.isArray(objectToCheck[parentKey])) {
      objectFixed[parentKey] = objectToCheck[parentKey].map((r: any) =>
        DeepCopy.copy(r)
      );
    } else {
      objectFixed[parentKey] = DeepCopy.copy(objectToCheck[parentKey]);
    }
  }
  return objectFixed;
}

function checkDifferencesBetween(
  originalValue: any,
  updatedValue: any,
  checkConfig: ICheckObjectDiffConfig
) {
  const initialKeys = Object.keys(originalValue);
  let differencesFound: any = {};
  let differencesExplained: any = {};
  for (let i = 0; i < initialKeys.length; i++) {
    const parentKey = initialKeys[i];
    if (checkConfig.excludeGlobalKeys.includes(parentKey)) {
      continue;
    }
    if (parentKey in updatedValue) {
      //Case of objects
      if (Array.isArray(updatedValue[parentKey])) {
        let originalValueCopyList = [];
        let updatedValueCopyList = [];

        if (parentKey in checkConfig.keysToCheckPerField) {
          const keysToAllowCheck =
            checkConfig.keysToCheckPerField[parentKey] || [];
          originalValueCopyList = originalValue[parentKey].map((r: any) =>
            cleanKeysFromObject(r, keysToAllowCheck)
          );
          updatedValueCopyList = updatedValue[parentKey].map((r: any) =>
            cleanKeysFromObject(r, keysToAllowCheck)
          );
        } else {
          originalValueCopyList = originalValue[parentKey];
          updatedValueCopyList = updatedValue[parentKey];
        }
        const differenceResult = deepObjectDiff(
          originalValueCopyList,
          updatedValueCopyList
        );
        if (Object.keys(differenceResult)?.length > 0) {
          differencesFound[parentKey] = differenceResult;
          differencesExplained[parentKey] = differenceResult;
        }
      } else {
        let originalValueObj = {};
        let updatedValueObj = {};
        if (isPureObject(updatedValue[parentKey])) {
          if (parentKey in checkConfig.keysToCheckPerField) {
            const keysToAllowCheck =
              checkConfig.keysToCheckPerField[parentKey] || [];
            originalValueObj = {
              [parentKey]: cleanKeysFromObject(
                originalValue[parentKey],
                keysToAllowCheck
              ),
            };
            updatedValueObj = {
              [parentKey]: cleanKeysFromObject(
                updatedValue[parentKey],
                keysToAllowCheck
              ),
            };
          } else {
            originalValueObj = { [parentKey]: originalValue[parentKey] };
            updatedValueObj = { [parentKey]: updatedValue[parentKey] };
          }
        } else {
          originalValueObj = { [parentKey]: originalValue[parentKey] };
          updatedValueObj = { [parentKey]: updatedValue[parentKey] };
        }
        const primitiveChange: any = deepObjectDiff(
          originalValueObj,
          updatedValueObj
        );
        if (primitiveChange != null && primitiveChange != undefined) {
          //Validate Keys
          if (Object.keys(primitiveChange).length == 0) {
            continue;
          }
          //Case Texts
          if (typeof primitiveChange[parentKey] == 'string') {
            const originalValueStr = originalValue[parentKey] || '';
            const updateValueStr = updatedValue[parentKey] || '';
            let verifyDiff =
              textDiff.diffChars(originalValueStr, updateValueStr, {
                ignoreCase: true,
              }) || [];
            verifyDiff = verifyDiff.filter((r: any) => {
              if (r.added) {
                return true;
              }
              if (r.removed) {
                return true;
              }
              return false;
            });
            differencesExplained[parentKey] = verifyDiff;
          } else {
            differencesExplained[parentKey] = primitiveChange[parentKey];
          }

          differencesFound[parentKey] = primitiveChange[parentKey];
        }
      }
    }
  }
  const finalResult = cleanAndValidateObject(differencesFound);
  return {
    result: finalResult,
    explain: differencesExplained,
  };
}

export { mapDataFromLocalStorage, checkDifferencesBetween, StringArrayObject };
