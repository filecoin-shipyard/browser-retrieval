import { memoize } from 'lodash';

import {
    ENVIRONMENT_TYPE_POPUP,
    ENVIRONMENT_TYPE_FULLSCREEN,
    ENVIRONMENT_TYPE_BACKGROUND,
} from './enums'

const getEnvironmentTypeMemo = memoize((url) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.pathname === '/index.html') {
        return ENVIRONMENT_TYPE_POPUP
    } else if (parsedUrl.pathname === '/home.html') {
        return ENVIRONMENT_TYPE_FULLSCREEN
    }

    return ENVIRONMENT_TYPE_BACKGROUND
});

export const getEnvironmentType = (url = window.location.href) => getEnvironmentTypeMemo(url)
