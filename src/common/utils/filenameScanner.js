const replaceExt = require('replace-ext');
const path = require('path');

const rules = [
    { regex   : /([^(]+)\((\d+)\)\W+-\W+S(\d+)E(\d+)\W+-\W+(.+)/,
      type    : 'TV',
      attributes : { show    : 1,
	  	     year    : 2,
		     season  : 3,
		     episode : 4,
		     title   : 5 }
    }
];

module.exports = function(filename) {
    var re = /([^(]+)\((\d+)\)\W+-\W+S(\d+)E(\d+)\W+-\W+(.+)/;
    var basename = path.basename(filename);
    basename = replaceExt(basename,'');
    var metadata;

    rules.forEach(function(rule) {
	if (metadata) {
	    return;
	}

	var found = basename.match(re);
	if (found) {
	  metadata = {};

	  Object.keys(rule.attributes).forEach(function(attr) {
	      console.log(attr);
	      metadata[attr] = found[rule.attributes[attr]].trim();
	  });

	  console.log(found);
	  console.log(metadata);
	}
    });

    return metadata;
}
