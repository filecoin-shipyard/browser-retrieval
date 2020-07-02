import getOptions from './shared/getOptions.js';
import run from './background/run.js';
import ports from './background/ports.js';

ports.startListening();

getOptions().then(run);
