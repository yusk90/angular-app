var gulp = require('gulp'),
    sass = require('gulp-sass'),
    path = require('path'),
    fs = require('fs'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    preprocess = require('gulp-preprocess'),
    htmlmin = require('gulp-htmlmin'),
    cssmin = require('gulp-cssmin'),
    autoprefixer = require('autoprefixer'),
    postcss = require('gulp-postcss'),
    flatten = require('gulp-flatten'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    eslint = require('gulp-eslint'),
    reporter = require('eslint-html-reporter'),
    TestServer = require('karma').Server,
    rework = require('gulp-rework'),
    reworkUrl = require('rework-plugin-url'),
    gulpIgnore = require('gulp-ignore'),
    gulpIf = require('gulp-if'),
    spriter = require('gulp-css-spriter'),
    imagemin = require('gulp-imagemin'),
    clean = require('del'),
    spritedImages = [],
    sourceFolderName = 'src/',
    buildFolderName = 'dist/',
    isProduction = process.env.NODE_ENV == 'production',
    params = {
        coverage: 'coverage',
        out: buildFolderName,
        images: buildFolderName + 'images/',
        fonts: buildFolderName + 'fonts/',
        css: buildFolderName + 'css/',
        js: buildFolderName + 'js/'
    };

gulp.task('clean', function () {
    return clean([params.out, params.coverage]);
});

gulp.task('html', function () {
    return gulp.src(sourceFolderName + 'html/*.html')
    .pipe(gulpIf(isProduction, htmlmin({ collapseWhitespace: true })))
    .pipe(gulpIf(isProduction, preprocess({ DEBUG: false })))
    .pipe(gulp.dest(params.out))
    .pipe(reload({ stream: true }));
});

gulp.task('favicon', function () {
    return gulp.src(sourceFolderName + 'html/favicon.ico')
    .pipe(gulp.dest(params.out))
    .pipe(reload({ stream: true }));
});

gulp.task('style', function (done) {
    gulp.src(sourceFolderName + 'scss/style.scss')
    .pipe(sass())
    .pipe(spriter({
        spriteSheet: './' + params.images + 'sprite.png',
        pathToSpriteSheetFromCSS: 'images/sprite.png',
        spriteSheetBuildCallback: function (err, result) {
            var pathName;
            spritedImages.length = 0;
            function getFileName(fullPath) {
                return fullPath.split(path.sep).pop();
            }
            for (pathName in result.coordinates) {
                if (result.coordinates.hasOwnProperty(pathName)) {
                    spritedImages.push(getFileName(pathName));
                }
            }
            if (!spritedImages.length) {
                clean(this.spriteSheet);
            }
            done();
        },
        spritesmithOptions: {
            padding: 5
        }
    }))
    .pipe(postcss([autoprefixer({
        browsers: ['last 2 versions', 'ie >= 9']
    })]))
    .pipe(rework(reworkUrl(function (url) {
        var editedPath = url.split('/');
        editedPath.shift();
        if (url.match(/\.(jpeg|jpg|gif|png)$/) != null && !url.match(/(sprite)/)) {
            return 'images/' + editedPath.join('/');
        } else if (url.match(/\.(ttf|otf|eot|woff|woff2|svg)/) != null) {
            return url.replace('../../', '');
        }
        return url;
    })))
    .pipe(gulpIf(isProduction, cssmin()))
    .pipe(gulp.dest(params.out))
    .pipe(reload({ stream: true }));
});

gulp.task('css', function () {
    return gulp.src(sourceFolderName + 'css/*.css')
    .pipe(gulp.dest(params.css))
    .pipe(reload({ stream: true }));
});

gulp.task('eslint', function () {
    return gulp.src([sourceFolderName + 'js/**/*.js', '!' + sourceFolderName + 'js/libs/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format()) // console output
    .pipe(eslint
        .format(reporter, function (results) {
            fs.writeFileSync(path.join(__dirname, 'eslint-report.html'), results);
        })
    );
});

gulp.task('js', function () {
    var files;

    if (!isProduction) {
        files = sourceFolderName + 'js/**/*';
    } else {
        files = [
            sourceFolderName + 'js/libs/**/*',
            sourceFolderName + 'js/**/*'
        ];
    }

    return gulp.src(files)
    .pipe(gulpIf(isProduction, concat('main.js')))
    .pipe(gulpIf(isProduction, uglify()))
    .pipe(gulp.dest(params.js))
    .pipe(reload({ stream: true }));
});

gulp.task('karma', function (done) {
    return new TestServer({
        configFile: path.join(__dirname, '/karma.conf.js'),
        singleRun: isProduction
    }, done).start();
});

gulp.task('fonts', function () {
    return gulp.src(sourceFolderName + 'fonts/**/*')
    .pipe(gulp.dest(params.fonts))
    .pipe(reload({ stream: true }));
});

gulp.task('images', function () {
    return gulp.src(sourceFolderName + 'scss/**/*.{png,jpg,jpeg,svg,gif}')
    .pipe(flatten())
    .pipe(gulpIf(spritedImages.length, gulpIgnore.exclude(spritedImages)))
    .pipe(imagemin())
    .pipe(gulp.dest(params.images))
    .pipe(reload({ stream: true }));
});

gulp.task('server', function () {
    browserSync.init({
        server: params.out
    });
});

gulp.task('style-images', gulp.series('style', 'images'));

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('html', 'css', 'eslint', 'js', 'fonts', 'favicon', 'style-images')
));

gulp.task('watch', function () {
    gulp.watch(sourceFolderName + 'html/**/*', gulp.parallel('html'));
    gulp.watch([sourceFolderName + 'scss/**/*.scss',
                sourceFolderName + 'scss/style.scss'], gulp.parallel('style'));
    gulp.watch([sourceFolderName + 'scss/**/*.{png,jpg,jpeg,svg,gif}'],
                gulp.parallel('style-images'));
    gulp.watch(sourceFolderName + 'css/**/*', gulp.parallel('css'));
    gulp.watch(sourceFolderName + 'js/**/*', gulp.parallel('eslint', 'js'));
    gulp.watch(sourceFolderName + 'fonts/**/*', gulp.parallel('fonts'));
});

gulp.task('default', gulp.series('build', gulp.parallel('karma', 'server', 'watch')));
