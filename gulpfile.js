const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const browserSync = require('browser-sync').create();
const plugins = [autoprefixer({brwosers: ['latest 2 version']})];

gulp.task('prefixer', function () {
	gulp.src('./css/main.css')
	.pipe(postcss(plugins))
	.pipe(gulp.dest('./css/dist'))
	.pipe(browserSync.stream());
});

gulp.task('watch', function () {
	gulp.watch('./css/main.css', ['prefixer']);
	gulp.watch(['./js/main.js', './index.html'], browserSync.reload);
});

gulp.task('serve', function () {
	browserSync.init({
		server: './'
	});
});

gulp.task('default', ['prefixer', 'watch', 'serve']);