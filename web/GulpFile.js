/**
 * Created by DrinkerOfTea on 12/03/2016.
 */

// Imports
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var babelify = require('babelify');

/**
 * Bundle the JavaScript files into a single js file, including translation from ES2015.
 * @param {boolean} Whether to watch the Javascript files and re-bundle if they change
 */
var bundle = function bundle(watch) {

    //Set up browserify, to run on JS and JSX files, including watchify plugin to rerun when files change
    var b = watchify(browserify('app/js/app.jsx',
        {
            entries     : 'app/js/app.jsx',
            extensions  : ['.jsx'],
            cache       : {},
            packageCache: {},
            debug       : true
        }).
        transform(babelify.configure({
            presets: ["es2015", "react", "stage-1"]
        })), { poll: true});

    var doBundling = function doBundling() {
        b.bundle().on('error', function(error){
            if (error instanceof SyntaxError) {
                gutil.log(gutil.colors.red('Syntax Error:'));
                gutil.log(gutil.colors.red(error.message));
                gutil.log(gutil.colors.red(error.codeFrame));
            } else {
                gutil.log(gutil.colors.red('Error:', error.message));
            }
        }).pipe(source('app.js')).pipe(gulp.dest('dist/js'));
        gutil.log('Bundling complete');
    };

    //If in watch mode trigger a rebundle on file changes:
    if(watch) {
        b.on('update', doBundling);
        gutil.log('Watchify watching for JS and JSX updates...');
    }

    return doBundling();
};

//Bundle but don't watch (only do after the JS files have been linted):
gulp.task('bundle', function() {
    return bundle(false);
});

//Bundle and watch:
gulp.task('bundle-watch', function() {
    return bundle(true);
});

gulp.task('copy-fonts', function() {
    return gulp.src('node_modules/roboto-fontface/fonts/Roboto/**/*').pipe(gulp.dest('./dist/fonts/Roboto'));
});

gulp.task('less', function () {
    return gulp.src('app/less/app.less')
        .pipe(less())
        .pipe(gulp.dest('dist/css'));
});

// Default task - run a full build, then watch for changes:
gulp.task('default', ['less', 'bundle-watch'], function() {

    //Note: watchify in bundle-watch task will already recompile JavaScript whenever it changes.

    //Watch less files and run less if it changes:
    gulp.watch('app/less/**/**', ['less']);

    gutil.log(gutil.colors.green('Build complete - watching for changes...'));
});

