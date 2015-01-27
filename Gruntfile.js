'use strict';
/*global module:false*/

var mountFolder = function(connect, dir, alias) {
    if (alias) {
        return connect().use(alias, connect.static(require('path').resolve(dir)));
    } else {
        return connect.static(require('path').resolve(dir));
    }
};

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
                    footer: ';\n' + 'window.bitbloqSU.version = "<%= pkg.version %>";',
                    process: function(src, filepath) {
                        return '// Source: ' + filepath + '\n' + src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    }
                },
                files: [{
                    src: ['src/bower_components/jquery/dist/jquery.js', 'src/js/init.js', 'src/js/messages.js', 'src/js/program.js', 'src/js/lib/sizeof.js', 'src/js/lib/i18n.js'],
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
                    'test/{,**/}*.js',
                    '!src/bower_components/{,**/}*.js'
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
        },
        connect: {
            options: {
                port: '9001',
                hostname: '0.0.0.0',
                middleware: function(connect) {
                    return [
                        mountFolder(connect, 'test'),
                        mountFolder(connect, 'src')
                    ];
                }
            },
            server: {
                options: {
                    keepalive: true
                }
            },
            test: {}
        },
        'mocha_phantomjs': {
            options: {
                urls: [
                    'http://localhost:<%= connect.options.port %>'
                ],
                setting: [
                    'webSecurityEnabled=false',
                    'remote-debugger-autorun=true',
                    'remote-debugger-port=9002',
                    'ignore-ssl-errors=true'
                ]
            },
            tap: {
                options: {
                    reporter: 'tap',
                }
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

    grunt.registerTask('test', [
        'jshint',
        'connect:test',
        'mocha_phantomjs:tap'
    ]);

    grunt.registerTask('server:test', [
        'jshint',
        'connect:server'
    ]);

};
