/**
 * Created by dmitrijmihajlov on 26.08.16.
 */
"use strict";
var gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    cssmin = require('gulp-minify-css'),
    sourcemaps = require('gulp-sourcemaps');

var path = {
    build: {
        css: 'assets/css',
        js: 'assets/js',
    },
    src: {
        jQuery: 'bower_components/jQuery/dist/jquery.min.js',
        js: 'src/js/main.js',
        style: 'src/styles/main.scss',
    },
    watch: {
        style: 'src/styles/*.scss',
        js: 'src/js/*.js',
    },
    map:'map',
    clean: './assets'
}

gulp.task('style:build', function () {
    gulp.src(path.src.style)
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(prefixer())
        .pipe(cssmin())
        .pipe(sourcemaps.write(path.map))
        .pipe(gulp.dest(path.build.css));
});
gulp.task('js:build', function () {
    gulp.src(path.src.jQuery)
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write(path.map))
        .pipe(gulp.dest(path.build.js));
    gulp.src(path.src.js)
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write(path.map))
        .pipe(gulp.dest(path.build.js))
});
gulp.task('watch', function(){
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
});