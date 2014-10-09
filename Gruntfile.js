'use strict';
/*global module:false*/
module.exports = function(grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            tmp: ['tmp'],
            dist: ['dist']
        },
        copy: {
            img: {
                expand: true,
                src: 'src/img/*.png',
                dest: 'dist/img',
                flatten: true,
                filter: 'isFile',
            },
            index: {
                expand: true,
                src: 'src/*',
                dest: 'dist',
                flatten: true,
                filter: 'isFile',
            }
        },
        // Task configuration.
        concat: {
            options: {
                // Only on 'use_strict' in file
                process: function(src, filepath) {
                    return '// Source: ' + filepath + '\n' + src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                },
                footer: 'logger.debugmode=0'
            },
            dist: {
                files: [{
                    src: ['src/css/*.css'],
                    dest: 'tmp/css/style.css'
                }, {
                    src: ['src/js/*.js', '!src/js/initDev.js'],
                    dest: 'tmp/js/main.js'
                }]
            }
        },
        uglify: {
            dist: {
                src: 'tmp/js/*.js',
                dest: 'dist/js/main.min.js'
            }
        },
        jshint: {
            options: grunt.file.readJSON('.jshintrc'),
            src: {
                src: ['src/**/*.js']
            }
        },
        cssmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'tmp/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'dist/css',
                    ext: '.min.css'
                }]
            }
        },
        usemin: {
            html: 'dist/index.html'
        }
    });

    // Default task.
    grunt.registerTask('default', [
        'clean',
        'build'
    ]);

    grunt.registerTask('build', [
        'clean',
        'jshint',
        'concat:dist',
        'copy',
        'uglify',
        'cssmin',
        'usemin',
    ]);

};
