// utils/responseHelper.js

const createResponse = (
  data = null,
  pagination = null,
  error = false,
  msg = null
) => {
  const response = {
    ret: {
      data: data,
    },
    error: error,
    msg: msg,
  };

  if (pagination) {
    response.ret.pagination = pagination;
  }

  return response;
};

module.exports = createResponse;
