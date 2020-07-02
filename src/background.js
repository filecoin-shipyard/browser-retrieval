import getOptions from './shared/getOptions.js';
import run from './background/run.js';

getOptions().then(run);
