const actors = {
  init: {
    address(isTestnet) {
      return `${isTestnet ? 't' : 'f'}01`;
    },
  },
};

export default actors;
