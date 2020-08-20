'use strict';

// BASE TOOLS
const gulp = require('gulp');
const config = require('./gulp-config.json');
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const browserSync = require('browser-sync').create();
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');

// FOR HTML

const htmlmin = require('gulp-htmlmin');

// FOR IMAGES

const imagemin = require('gulp-imagemin');

// FOR SASS => CSS

const sass = require('gulp-sass');
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const sassLint = require('gulp-sass-lint');

// FOR JAVASCRIPT

const babel = require('gulp-babel');
const jshint = require('gulp-jshint');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const gulpPlumber = require('gulp-plumber');



// BROWSER RELOAD

function reload(cb) {
    browserSync.reload();
    cb();
}

// SERVER INITIALISIEREN 

function serve(cb) {
    browserSync.init({
        server: {
            baseDir: (config.serv.dist)
        }
    });
    cb();
}

// HTML für die Entwicklung

function html_dev() {
    // Alle HTML Dateien im SRC Ordner aufnehmen 
    return gulp.src(config.html.src)
        // Init Plumber
        .pipe(plumber())
        // HTML -> minimierte HTML Version nach DEV Einstellungen 
        .pipe(htmlmin({
            collapseWhitespace: false,
            removeComments: false,
            html5: true,
            removeEmptyAttributes: false,
            removeTagWhitespace: false,
            sortAttributes: false,
            sortClassName: false
        }))
        // Schreibe HTML Dateien in das Verzeichnis .dist
        .pipe(gulp.dest(config.html.dist));
}

// HTML MINIFY

function html() {
    // Alle HTML Dateien im SRC Ordner aufnehmen 
    return gulp.src(config.html.src)
        // Init Plumber
        .pipe(plumber())
        // HTML -> minimierte HTML Version mit den Einstellungen für die Live Version  
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            html5: true,
            removeEmptyAttributes: true,
            removeTagWhitespace: true,
            sortAttributes: false,
            sortClassName: false
        }))
        // Schreibe minimierte HTML Dateien in das Verzeichnis .dist
        .pipe(gulp.dest(config.html.dist));
}

// CSS für die Entwicklung.
function css_dev() {
    // Alle SASS Dateien aus folgendem Ordner 
    return gulp.src(config.sass.src)
        // Init Plumber
        .pipe(plumber())
        // LINT SASS
        .pipe(sassLint({
            options: {
                formatter: 'compact',
                'merge-default-rules': false
            },
            files: { ignore: '**/*.sass' },
            rules: {
                'no-ids': 1,
                'no-mergeable-selectors': 0
            }
        }))
        // Format SASS
        .pipe(sassLint.format())
        // Start Source Map
        .pipe(sourcemaps.init())
        // SCSS compilieren -> CSS
        .pipe(sass.sync({ outputStyle: "compact" })).on('error', sass.logError)
        // Suffix hinzufügen
        .pipe(rename({ basename: 'main', suffix: ".min" }))
        // HInzufügen von Autoprefixes & cssNano
        .pipe(postcss([autoprefixer()]))
        // Schreibe CSS Source Map
        .pipe(sourcemaps.write(''))
        // Schreibe CSS Dateien in das Verzeichnis .dist
        .pipe(gulp.dest(config.sass.dist))
        // Page aktualisieren 
        .pipe(browserSync.stream());

}

// SASS ZU CSS MINIFY

function css() {
    // Alle SASS Dateien aus folgendem Ordner 
    return gulp.src(config.sass.src)
        // Init Plumber
        .pipe(plumber())
        // LINT SASS
        .pipe(sassLint({
            options: {
                formatter: 'stylish',
                'merge-default-rules': false
            },
            files: { ignore: '**/*.sass' },
            rules: {
                'no-ids': 1,
                'no-mergeable-selectors': 0
            }
        }))
        // Format SASS
        .pipe(sassLint.format())
        // Start Source Map
        .pipe(sourcemaps.init())
        // SCSS compilieren -> CSS
        .pipe(sass.sync({ outputStyle: "compressed" })).on('error', sass.logError)
        // Suffix hinzufügen
        .pipe(rename({ basename: 'main', suffix: ".min" }))
        // HInzufügen von Autoprefixes & cssNano
        .pipe(postcss([autoprefixer(), cssnano()]))
        // Schreibe CSS Source Map
        .pipe(sourcemaps.write(''))
        // Schreibe CSS Dateien in das Verzeichnis .dist
        .pipe(gulp.dest(config.sass.dist))
        // Page aktualisieren 
        .pipe(browserSync.stream());

}
// KOMPILIEREN JAVASCRIPT 
function script() {
    // JavaScript Dateien aufnehmen 
    return gulp.src(config.js.src)
        // Init Plumber
        .pipe(plumber(((error) => {
            gutil.log(error.message);
        })))
        // Start Source Map
        .pipe(sourcemaps.init())
        // concat
        .pipe(concat('concat.js'))
        // Use Babel
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        // JavaScript Lint
        .pipe(jshint())
        // Report von JsLint
        .pipe(jshint.reporter('jshint-stylish'))
        // Minify
        .pipe(uglify())
        // Suffix hinzufügen
        .pipe(rename({ basename: 'main', suffix: ".min" }))
        // Schreibe Sourcemap
        .pipe(sourcemaps.write(''))
        // Schreibe JavaScript Dateien in das Verzeichnis .dist
        .pipe(gulp.dest(config.js.dist));
}
// IMAGES 
function img() {
    return gulp.src('./src/images/*')
        .pipe(imagemin(
            [
                imagemin.gifsicle({ interlaced: true }),
                imagemin.mozjpeg({ quality: 75, progressive: true }),
                imagemin.optipng({ optimizationLevel: 5 }),
                imagemin.svgo({
                    plugins: [
                        { removeViewBox: true },
                        { cleanupIDs: false }
                    ]
                })
            ]
        ))
        // Schreibe Image Dateien in das Verzeichnis .dist
        .pipe(gulp.dest('./dist/images'))

}

// ENTFERNEN DER SOURCE MAPS 

function removeSourceMaps() {
    return del([
        './dist/css/main.min.css.map',
        './dist/js/main.min.js.map'
    ]);

}

// DATEIEN ÜBERWACHEN 
function watch() {
    gulp.watch([
            './src/*.html',
            './src/js/**/*.js',
            './src/sass/**/*.scss'
        ],
        gulp.series(css, html, script, reload));

}
// kompilieren des Projekts für die Produktion
const build = gulp.series(html, css, script, img, removeSourceMaps);

// kompilieren der Dateien während der Entwicklung + BrowserSync + Watch
const build_dev = gulp.series(html_dev, css_dev, script, img, serve, watch);
// Watch
const sync = gulp.series(serve, watch, img);


exports.build = build;
exports.build_dev = build_dev;
exports.default = build;
exports.watch = sync;