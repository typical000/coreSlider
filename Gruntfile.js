/*
 * Gruntfile.js
 * Description: Simple Grunt build configuration
 * Author: Pavel Davydov
 * Licence: MIT
 */

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Autoprefixer supported browsers config
  var autoprefixerBrowsers = [
    'Android >= 4',
    'Chrome >= 20',
    'Firefox >= 31',
    'Explorer >= 9',
    'iOS >= 6',
    'Opera >= 30',
    'Safari >= 7'
  ];

  grunt.initConfig({
    // Read package and load all needed npm packages
    pkg: grunt.file.readJSON('package.json'),
    // Run clean task first (remove .min and other dynamically created files
    clean: {
      css: [
        'css/*'
      ]
    },
    // JADE
    jade: {
      development: {
        options: {
          client: false,
          pretty: true
        },
        files: [{
          cwd: "templates",
          src: "*.jade",
          dest: "",
          expand: true,
          ext: ".html"
        }]
      }
    },
    // SASS (SCSS) configuration
    sass: {
      development: {
        options: {
          unixNewlines: true,
          compass: true,
          update: true,
          require: ['compass', 'susy'],
          style: 'compact'
        },
        files: {
          'css/application.css': 'scss/application.scss'
        }
      },
    },
    // Configure autoprefixer
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')({
            browsers: autoprefixerBrowsers
          })
        ]
      },
      dist: {
        expand: true,
        src: 'css/*.css'
      }
    },
    // Configure watcher
    watch: {
      css: {
        files: ['**/*.scss'],
        tasks: ['sass', 'postcss']
      },
      templates: {
        files: ['templates/**/*.jade'],
        tasks: ['jade']
      }
    }
  });

  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.registerTask('development', 'dev evironment task', [
    'clean',
    'jade',
    'sass',
    'postcss',
    'watch'
  ]);
  grunt.registerTask('default', 'Default build task', function(){
    grunt.task.run('development');
  });

};