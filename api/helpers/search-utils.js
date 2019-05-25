const binaryIndexOf = function(arr, val, giveNearest, start, end) {
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
    if (val < arr[M]) {
      R = M - 1;
    } else if (val > arr[M]) {
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
