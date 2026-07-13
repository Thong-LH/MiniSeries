const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Names the release APK after the app (e.g. MiniSeries-v1.0.0.apk).
 */
module.exports = function withApkName(config, props = {}) {
  const rawName = props.fileName || config.name || 'MiniSeries';
  const fileName = String(rawName).replace(/[^a-zA-Z0-9._-]/g, '');

  return withAppBuildGradle(config, (gradleConfig) => {
    const marker = '// @miniseries/apk-name';
    if (!gradleConfig.modResults.contents.includes(marker)) {
      gradleConfig.modResults.contents += `

${marker}
android.applicationVariants.configureEach { variant ->
    variant.outputs.configureEach { output ->
        output.outputFileName = "${fileName}-v\${variant.versionName}.apk"
    }
}
`;
    }
    return gradleConfig;
  });
};
