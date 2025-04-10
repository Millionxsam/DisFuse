module.exports = function override(config, env) {
    // remove existing source-map-loader from CRA's default config
    config.module.rules = config.module.rules.map(rule => {
      if (Array.isArray(rule.oneOf)) {
        rule.oneOf = rule.oneOf.filter(innerRule => {
          return !(
            innerRule.enforce === 'pre' &&
            innerRule.use &&
            innerRule.use.some(loader => loader.loader && loader.loader.includes('source-map-loader'))
          );
        });
      }
      return rule;
    });
  
    config.module.rules.push({
      test: /\.js$/,
      enforce: 'pre',
      use: ['source-map-loader'],
      exclude: /node_modules/, // don't parse source maps in node_modules
    });
  
    // ignore all warnings from node_modules
    config.ignoreWarnings = [
      warning =>
        warning.module &&
        warning.module.resource &&
        warning.module.resource.includes('node_modules'),
    ];
  
    return config;
  };  