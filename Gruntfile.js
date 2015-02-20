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

    if (grunt.option('env') === undefined) {
        grunt.option('env', 'int');
    }

    // Project configuration.
    grunt.initConfig({
        // Package config
        pkg: grunt.file.readJSON('package.json'),
        environments: grunt.file.readJSON('environments.json'),
        env: grunt.option('env'),
        clean: {
            tmp: ['tmp'],
            dist: ['dist']
        },
        watch: {
            scripts: {
                files: ['{,**/}*.js'],
                tasks: ['jshint'],
                options: {
                    // spawn: false,
                    interrupt: true
                },
            },
        },
        copy: {
            img: {
                expand: true,
                src: 'src/img/*',
                dest: 'dist/' + grunt.option('env') + '/img',
                flatten: true,
                filter: 'isFile'
            },
            fonts: {
                expand: true,
                src: 'src/css/fonts/*',
                dest: 'dist/' + grunt.option('env') + '/css/fonts',
                flatten: true,
                filter: 'isFile'
            },
            locales: {
                expand: true,
                cwd: 'src/_locales',
                src: '**/*.json',
                dest: 'dist/' + grunt.option('env') + '/_locales/'
            },
            index: {
                expand: true,
                src: 'src/*',
                dest: 'dist/' + grunt.option('env') + '',
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
                    src: ['src/js/init.js', 'src/js/lib/sizeof.js', 'src/js/lib/i18n.js', 'src/js/serial.js', 'src/js/messages.js', 'src/js/program.js'],
                    dest: 'tmp/' + grunt.option('env') + '/js/main.js'
                }]
            },
            dist_css: {
                files: [{
                    src: ['src/css/*.css'],
                    dest: 'tmp/' + grunt.option('env') + '/css/style.css'
                }]
            }
        },
        uglify: {
            dist: {
                src: 'tmp/' + grunt.option('env') + '/js/*.js',
                dest: 'dist/' + grunt.option('env') + '/js/main.min.js'
            }
        },
        jshint: {
            options: grunt.file.readJSON('.jshintrc'),
            src: {
                src: [
                    'src/{,**/}*.js',
                    'test/{,**/}*.js',
                    '!src/bower_components/{,**/}*.js',
                    '!test/src/bower_components/{,**/}*.js',
                ]
            }
        },
        cssmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'tmp/' + grunt.option('env') + '/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'dist/' + grunt.option('env') + '/css',
                    ext: '.min.css'
                }]
            }
        },
        usemin: {
            html: 'dist/' + grunt.option('env') + '/index.html'
        },
        replace: {

            manifest: {
                src: ['dist/' + grunt.option('env') + '/manifest.json'],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    from: /"version":[^,]*/g,
                    to: '"version": "<%= environments.' + grunt.option('env') + '.version %>"'
                }, {
                    from: /"name":[^,]*/g,
                    to: '"name":' + '"<%= environments.' + grunt.option("env") + '.name %>"'
                }, {
                    from: /"short_name":[^,]*/g,
                    to: '"short_name":' + '"<%= environments.' + grunt.option("env") + '.short_name %>"'
                }, {
                    from: "matches_handler",
                    to: '<%= environments.' + grunt.option("env") + '.url %>' + 'chromeapp.html'
                }, {
                    from: "matches_externally_connectable",
                    to: '<%= environments.' + grunt.option("env") + '.url %>' + '*'
                }]
            }
        },
        // make a zipfile
        compress: {
            main: {
                options: {
                    archive: 'dist/' + grunt.option('env') + '/app_dist_' + grunt.option('env') + '_<%= environments.' + grunt.option('env') + '.version %>.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/' + grunt.option('env'),
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
        'copy',
        'replace',
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
        'connect:server',
        'watch'
    ]);

};
