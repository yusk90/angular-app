/* global module */

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'src/js/libs/angular.js',
            'src/js/*.js',
            'src/tests/*.js'
        ],
        exclude: [
            // 'app/js/init.js'
        ],
        preprocessors: {
            'src/js/*.js': ['coverage']
        },
        reporters: ['progress', 'coverage'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: false,
        concurrency: Infinity,
        coverageReporter: {
            type: 'html',
            dir: 'coverage/'
        }
    });
};
