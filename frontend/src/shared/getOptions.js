import {LOCAL_STORAGE_OPTIONS, defaultValues} from "./constants";

function getOptions() {
  const options = localStorage.getItem(LOCAL_STORAGE_OPTIONS);

  if (!options) {
    localStorage.setItem(LOCAL_STORAGE_OPTIONS, JSON.stringify(defaultValues));
  }

  return new Promise(resolve => {
    resolve(options ? JSON.parse(options) : defaultValues);
  });
}

export default getOptions;
