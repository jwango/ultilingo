const opResult = function(success, statusCode, error) {
  return {
    isOpResult: true,
    success: success,
    statusCode: statusCode,
    error: error
  };
}

module.exports = opResult;