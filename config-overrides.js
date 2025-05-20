const path = require("path");

module.exports = function override(config, env) {
  // Enable persistent filesystem caching
  config.cache = {
    type: "filesystem",
    cacheDirectory: path.resolve(__dirname, ".webpack-cache"),
    buildDependencies: {
      config: [__filename], // Rebuild cache when this file changes
    },
  };

  // Disable source maps in development for faster startup
  if (env === "development") {
    config.devtool = false;
  }

  // Remove CRA's default source-map-loader and re-add excluding node_modules
  config.module.rules = config.module.rules.map((rule) => {
    if (Array.isArray(rule.oneOf)) {
      rule.oneOf = rule.oneOf.filter((innerRule) => {
        return !(
          innerRule.enforce === "pre" &&
          innerRule.use &&
          innerRule.use.some(
            (loader) =>
              loader.loader && loader.loader.includes("source-map-loader")
          )
        );
      });
    }
    return rule;
  });

  config.module.rules.push({
    test: /\.js$/,
    enforce: "pre",
    use: ["source-map-loader"],
    exclude: /node_modules/,
  });

  // Suppress warnings from node_modules
  config.ignoreWarnings = [
    (warning) =>
      warning.module &&
      warning.module.resource &&
      warning.module.resource.includes("node_modules"),
  ];

  return config;
};
