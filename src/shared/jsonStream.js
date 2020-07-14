const jsonStream = {
  stringify(source) {
    return (async function* () {
      for await (const object of source) {
        yield JSON.stringify(object);
      }
    })();
  },

  parse(source) {
    return (async function* () {
      for await (const data of source) {
        try {
          yield JSON.parse(data.toString());
        } catch (error) {
          yield data;
        }
      }
    })();
  },
};

export default jsonStream;
