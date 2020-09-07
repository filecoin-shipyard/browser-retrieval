import {LOCAL_STORAGE_OPTIONS} from "./constants";

function setOptions(data) {
  localStorage.setItem(LOCAL_STORAGE_OPTIONS, JSON.stringify(data));

  return new Promise(resolve => {
    resolve(data);
  });
}

export default setOptions;
