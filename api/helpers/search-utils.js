const binaryIndexOf = function(arr, val, giveNearest, start, end, compareFn) {
  let compare = compareFn;
  if (!compareFn) {
    compare = function(a, b) {
      if (a < b) {
        return -1;
      } else if (a > b) { 
        return 1;
      }
      return 0;
    };
  }
  let L = 0;
  let R = arr.length - 1;
  if (!Array.isArray(arr)) {
    return -1;
  }
  if (start != undefined && start >= 0) {
    L = Math.min(start, arr.length - 1);
  }
  if (end != undefined && end < arr.length) {
    R = Math.max(0, end, L);
  }

  let M;
  let res = -1;
  while (L <= R && res < 0) {
    M = L + Math.floor((R - L) / 2);
    if (compare(val, arr[M]) < 0) {
      R = M - 1;
    } else if (compare(val, arr[M]) > 0) {
      L = M + 1;
      M = L;
    } else {
      res = M;
    }
  }
  if (giveNearest) {
    return M;
  } else {
    return res;
  }
}

module.exports = {
  binaryIndexOf: binaryIndexOf
};
