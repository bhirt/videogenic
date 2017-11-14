let  glob = require('glob');
let  path = require('path');

module.exports = function(grunt) {

// destination less template
    let lessDest = './dist/static/css/{file}.css';

    // source less template
    let lessSrc = './express/less/{file}.less';

    // list of modules to build
    let lessModules = ['style','trim','split','edlcutter','rc-slider'];

    // Uses lessDest,lessSrc and lessModules to build the files: hash
    function lessMap() {
        let map = {};

        lessModules.forEach(function(file) {
            let src = lessSrc.replace('{file}',file);
            let dest = lessDest.replace('{file}',file);
            map[dest] = src;
        });

        return map;
    }

    grunt.initConfig({
    
        less: {
            dev: {
                options: {
                    strictMath : true                       // if off, grid layouts break; less would transform 'grid-column: 1 / 5' -> 'grid-column: 0.2'
                },
                files: lessMap()
            },
            prod: {
                options: {
                    strictMath : true,                      // if off, grid layouts break; less would transform 'grid-column: 1 / 5' -> 'grid-column: 0.2'
                },
                files: lessMap()
            }
        },
        watch: {
            less: {
                files: ['css/*.less'],
                tasks: ['less:dev'],
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');


    grunt.registerTask('default', ['less:dev']);
    grunt.registerTask('dev', ['watch:less']);

    grunt.event.on('watch', function(action, filepath, target) {
        grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
    });
};
