/*Gulp (https://gulpjs.com/) is an automation tool that makes
  the life of a developer far easier. Oftentimes developers have
  a number of things they must do that are tedius and repetitive.
  For example, running "npm test" and then "npm start" every time
  we want to deploy our code. Or running "npm run webpack" every
  time we want to bundle our client code.

  Gulp allows us to turn these repetitive jobs into "tasks" that
  it can run for us.
*/

/*Much like express, gulp is built to encorporate various plugins.
  Many of these plugins are available on npm. Since each is made
  by a different developer they all have their own syntax and
  documentation that you'll need to follow. Below we import a number
  of gulp-friendly versions of libraries we have used before such
  as eslint, nodemon, webpack, etc. We also import the root gulp
  library, and we import gulp-sass which will build our scss into
  css. Note that we give it the dart-sass library to use for doing
  the building.
*/
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const webpack = require('webpack-stream');
const nodemon = require('gulp-nodemon');
const eslint = require('gulp-eslint-new');
const webpackConfig = require('./webpack.config.js');

/*Here is our first gulp task. Gulp tasks are defined as functions
  and have one requirement. They must take in a callback function
  (called "done" here), and they must call that callback at the end
  of the task. This lets the gulp library know that our task has
  completed.

  This task is meant to compile our sass into css. We start by using
  the src function from the gulp library to load the file. gulp.src()
  creates a "stream" object, which can be used to pass information
  between consecutive function calls. So gulp.src() loads our file
  into a stream. We then "pipe" that stream into the next function.

  The next function, sass(), recieves our file from the gulp.src()
  stream, and operates on that file. Due to the specifications of
  the gulp-sass library, this will convert an .scss file to css.
  The gulp-sass library also defines an on error handler.

  The output from the sass() function is the compiled css based on
  our main.scss file. We then pass or "pipe" that result into the
  gulp.dest() function. That function takes in some content and writes
  it to a given file. By default the file name will have the same
  name as the input file. In this case 'main.scss' turns into 'main.css'
  in the hosted folder.

  Finally we let gulp know we are done with our task.
*/
const sassTask = (done) => {
    gulp.src('./scss/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./hosted'));

    done();
};

/*Here we have another task whose job it is to run webpack based
  on the specifications in our webpackConfig (imported above).
  We could simply run "npm run webpack" to accomplish the same
  results, but by putting it into a gulp task we can combine it
  with other tasks.
*/
const jsTask = (done) => {
    webpack(webpackConfig)
        .pipe(gulp.dest('./hosted'));
    
    done();
}
  
/*Our third task will run eslint on our code. In sassTask above
  we saw that gulp.src() can take in a single file. We can also
  give it a pattern to match such as the one in lintTask. The 
  pattern below tells gulp to load every .js file from any folder
  inside the .js folder. It will then pass those files into the
  eslint library which will function just like npm test.
*/
const lintTask = (done) => {
    gulp.src('./server/**/*.js')
        .pipe(eslint({fix: true}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
    
    done();
}

/*One major benefit of gulp is that because it is running node
  under the hood, it can multithread our tasks. The gulp.parallel
  function takes in any number of tasks and can run them on
  separate threads simultaneously. This can seriously speed up
  our tasks, especially if each of them takes a while.
*/
const build = gulp.parallel(sassTask, jsTask, lintTask);

/*This watch task below is doing quite a lot. The gulp.watch()
  function takes in a single file, folder, pattern, or array
  of files/folders/patterns and observes them. When any of the
  given files change, it will rerun the task given as the second
  parameter.

  For example, the first watch() call says that any time something
  in our scss folder changes, the sassTask should be rerun.

  The second watch statement says any time a .jsx or .js file in
  the client folder changes, the jsTask should be run.

  We will also use our watch task to run nodemon. The gulp-nodemon
  library takes in a few options. The script option defines which
  file should be run on restart (our app.js file). The tasks array
  defines which tasks to run before restarting. Note that these tasks
  need to be exported from our gulpFile to work properly. In this 
  case, when our server code is about to restart, we will lint it first.

  The watch option tells nodemon which folder to watch for changes.
  Finally we also give it our done callback so that it properly tells
  gulp when it has stopped watching our code.
*/
const watch = (done) => {
    gulp.watch('./scss', sassTask);
    gulp.watch(['./client/*.js', './client/*.jsx'], jsTask);
    nodemon({ 
        script: './server/app.js',
        tasks: ['lintTask'],
        watch: ['./server'],
        done: done
    });
}

/*From our gulpFile, we want to export any tasks that we want
  to be able to call from our package.json or that we need to
  be called by packages like gulp-nodemon. In this case we can
  simply export all of them.

  To call a gulp task from a package.json script, we simply
  say "gulp [TASKNAME]". See examples of this in the package.json
  in this project.
*/
module.exports = {
	sassTask,
    build,
    jsTask,
    lintTask,
    watch
};