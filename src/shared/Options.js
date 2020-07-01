const defaultOptions = {
  port: 1234,
  pricePerByte: { '*': 0.0000000001 },
};

const Options = {
  get(callback) {
    chrome.storage.local.get(Object.keys(defaultOptions), result =>
      callback({
        ...defaultOptions,
        ...result,
      }),
    );
  },
  set(data, callback) {
    chrome.storage.local.set(data, callback);
  },
};

export default Options;
