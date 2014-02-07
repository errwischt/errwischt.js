module.exports = function(grunt) {
  var pkg = require('./package.json');

  grunt.initConfig({
    concat: { // grunt-contrib-concat
      dist: {
        src: ['bower_components/tracekit/tracekit.js', 'assets/javascripts/errwischt.js'],
        dest: 'dist/errwischt.js'
      },
      pureDist: {
        src: ['assets/javascripts/errwischt.js'],
        dest: 'dist/errwischt.pure.js'
      },
      pureDep: {
        src: ['bower_components/tracekit/tracekit.js'],
        dest: 'dist/errwischt.deps.js'
      },
      options: {
        process: function(src) {
          return src.replace('$VERSION$', pkg.version);
        },
        separator: ';'
      }
    },
    uglify: { // grunt-contrib-uglify
      dist: {
        files: {
          'dist/errwischt.min.js': 'dist/errwischt.js',
          'dist/errwischt.pure.min.js': 'dist/errwischt.pure.js',
          'dist/errwischt.deps.min.js': 'dist/errwischt.deps.js'
        },
        options: {
          preserveComments: 'some'
        }
      }
    },
    watch: {
      javascript: {
        files: ['assets/**/*.js'],
        tasks: ['build']
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['concat', 'uglify']);
};
