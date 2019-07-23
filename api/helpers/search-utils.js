const binaryIndexOf = function(arr, val, options) {
  const opt = options || {};
  if (!opt.compareFn) {
    opt.compareFn = function(a, b) {
      if (a < b) {
        return -1;
      } else if (a > b) { 
        return 1;
      }
      return 0;
    };
  }
  if (!opt.mapFn) {
    opt.mapFn = function(a) { return a; }
  }
  let L = 0;
  let R = arr.length - 1;
  if (!Array.isArray(arr)) {
    return -1;
  }
  if (opt.start != undefined && opt.start >= 0) {
    L = Math.min(opt.start, arr.length - 1);
  }
  if (opt.end != undefined && opt.end < arr.length) {
    R = Math.max(0, opt.end, L);
  }

  let M;
  let res = -1;
  while (L <= R && res < 0) {
    M = L + Math.floor((R - L) / 2);
    if (opt.compareFn(val, opt.mapFn(arr[M])) < 0) {
      R = M - 1;
    } else if (opt.compareFn(val, opt.mapFn(arr[M])) > 0) {
      L = M + 1;
      M = L;
    } else {
      res = M;
    }
  }
  if (opt.giveNearest) {
    return M;
  } else {
    return res;
  }
}

module.exports = {
  binaryIndexOf: binaryIndexOf
};
