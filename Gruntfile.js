module.exports = function(grunt) {
  grunt.initConfig({
    concat: { // grunt-contrib-concat
      dist: {
        src: ['bower_components/tracekit/tracekit.js', 'assets/javascripts/bandage.js'],
        dest: 'bandage.js'
      },
      options: {
        separator: ';',
      }
    },
    uglify: { // grunt-contrib-uglify
      dist: {
        files: {
          'bandage.min.js': 'bandage.js'
        },
        options: {
          preserveComments: 'some'
        }
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('build', ['concat', 'uglify']);
};
