/*
 * DeepCopy class helps to copy an Original Array or an Object without impacting on original data
 */

export class DeepCopy {
  static copy(data: any) {
    let node: any;
    if (Array.isArray(data)) {
      node = data.length > 0 ? data.slice(0) : [];
      node.forEach((e: any, i: number) => {
        if (
          (typeof e === 'object' && Object.keys(e).length > 0) ||
          (Array.isArray(e) && e.length > 0)
        ) {
          node[i] = DeepCopy.copy(e);
        }
      });
    } else if (data && typeof data === 'object') {
      node = data instanceof Date ? data : Object.assign({}, data);
      Object.keys(node).forEach((key) => {
        if (
          (typeof node[key] === 'object' &&
            Object.keys(node[key]).length > 0) ||
          (Array.isArray(node[key]) && node[key].length > 0)
        ) {
          node[key] = DeepCopy.copy(node[key]);
        }
      });
    } else {
      node = data;
    }
    return node;
  }
}
