'use strict';
/*global module:false*/
module.exports = function(grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        // Package config
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            tmp: ['tmp'],
            dist: ['dist']
        },
        copy: {
            img: {
                expand: true,
                src: 'src/img/*',
                dest: 'dist/img',
                flatten: true,
                filter: 'isFile'
            },
            fonts: {
                expand: true,
                src: 'src/css/fonts/*',
                dest: 'dist/css/fonts',
                flatten: true,
                filter: 'isFile'
            },
            locales: {
                expand: true,
                cwd: 'src/_locales',
                src: '**/*.json',
                dest: 'dist/_locales/'
            },
            index: {
                expand: true,
                src: 'src/*',
                dest: 'dist',
                flatten: true,
                filter: 'isFile'
            }
        },
        // Task configuration.
        concat: {
            dist_js: {
                options: {
                    footer: ';\n' + 'window.bitbloqSU.version = "<%= pkg.version %>";\nlogger.debugmode=0;\ndocument.addEventListener("DOMContentLoaded", function() {bitbloqSU.UI.init();});',
                    process: function(src, filepath) {
                        return '// Source: ' + filepath + '\n' + src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    }
                },
                files: [{
                    src: ['src/bower_components/jquery/dist/jquery.js', 'src/js/available_boards.js', 'src/js/lib/sizeof.js', 'src/js/lib/logger.js', 'src/js/lib/i18n.js', 'src/js/bitbloq_serial.js', 'src/js/bitbloq_program.js', 'src/js/bitbloq_comm.js', 'src/js/init.js', '!src/js/init_dev.js', '!src/js/banner_dev.js'],
                    dest: 'tmp/js/main.js'
                }]
            },
            dist_css: {
                files: [{
                    src: ['src/css/*.css'],
                    dest: 'tmp/css/style.css'
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
                src: [
                    'src/{,**/}*.js',
                    '!src/bower_components/jquery/{,**/}*.js'
                ]
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
        },
        replace: {
            manifest: {
                src: ['src/manifest.json'],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    from: /"version":[^,]*/g,
                    to: '"version": "<%= pkg.version %>"'
                }]
            }
        },
        // make a zipfile
        compress: {
            main: {
                options: {
                    archive: 'dist/app_dist_<%= pkg.version %>.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist',
                    src: ['**']
                }]
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['dist']);

    grunt.registerTask('dist', [
        'clean',
        'jshint',
        'concat',
        'replace',
        'copy',
        'cssmin',
        'usemin',
        'uglify',
        'compress'
    ]);

};
