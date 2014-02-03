module.exports = function(grunt) {
  var pkg = require('./package.json');

  grunt.initConfig({
    concat: { // grunt-contrib-concat
      dist: {
        src: ['bower_components/tracekit/tracekit.js', 'assets/javascripts/bandage.js'],
        dest: 'bandage.js'
      },
      pureDist: {
        src: ['assets/javascripts/bandage.js'],
        dest: 'bandage.pure.js'
      },
      pureDep: {
        src: ['bower_components/tracekit/tracekit.js'],
        dest: 'bandage.deps.js'
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
          'bandage.min.js': 'bandage.js',
          'bandage.pure.min.js': 'bandage.pure.js',
          'bandage.deps.min.js': 'bandage.deps.js'
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
