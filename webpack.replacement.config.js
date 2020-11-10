const path = require('path');

const getFileReplacementsMap = (env) => {
  if (!env) {
    return {};
  }

  return {
    fileReplacements: [
      {
        replace: 'src/shared/environments/env.js',
        with: `src/shared/environments/env.${env}.js`,
      },
    ],
  };
};

const getFileReplacementsRules = () => {
  const envLocation = process.env.ENV;

  const configuration = getFileReplacementsMap(envLocation);

  const fileReplacements = [];

  if (!configuration || !configuration.fileReplacements) {
    return [];
  }

  for (const replacement of configuration.fileReplacements) {
    const replace = {
      test: path.resolve(replacement.replace),
      loader: 'file-replace-loader',
      options: {
        replacement: path.resolve(replacement.with),
        async: true,
      },
    };
    fileReplacements.push(replace);
  }

  return fileReplacements;
};

module.exports = { getFileReplacementsRules };
