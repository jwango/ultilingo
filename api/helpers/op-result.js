const opResult = function(success, statusCode, error, payload) {
  return {
    isOpResult: true,
    success: success,
    statusCode: statusCode,
    error: error,
    payload: payload
  };
}

module.exports = opResult;