// Filter SAP-internal properties from package.json files
// 
// Background: 
//   npm install writes internal data (e.g. the SAP Nexus and GitHub URLs) into
//   the package.json files of the installed modules. Before releasing such 
//   a self-contained package to customers, the package.json files have to be
//   filtered.
//
// Usage:
//   node filter-package.json <intput file> [--verbose]
//
// Recursive in bash:
//   find $PWD -name package.json -exec node <path>/filter-package.js {} \;
// 
var fs = require('fs');

// Cmd line args
if (process.argv.length < 3) {
  console.log("Usage: node filter-package.json <input file> [--verbose]");
  process.exit(1);
}
var inputfile = process.argv[2];
var verbose = (process.argv.length > 3) && (process.argv[3] == "--verbose");
 
// Read input
console.log("Filtering file", inputfile);
var inputPackageJson = require(inputfile);
if (verbose) {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  console.log("Input JSON:");
  console.log(JSON.stringify(inputPackageJson, null, 2));
}
 
// Filter 
delete inputPackageJson.dist;           // Contains the SAP Nexus URL
delete inputPackageJson._resolved;      // Contains the SAP Nexus URL
delete inputPackageJson._from;          // Contains the SAP Nexus URL
if (inputPackageJson.repository !== undefined && inputPackageJson.repository.url !== undefined && inputPackageJson.repository.url.indexOf("sap.corp") > -1) {
  delete inputPackageJson.repository;   // Contains a SAP-internal source repository
}
 
// Produce output
outputJsonString = JSON.stringify(inputPackageJson, null, 2);
if (verbose) {
  console.log("------------------------------");
  console.log("Filtered json:");
  console.log(outputJsonString);
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
}
 
 // Write to file
if (verbose) {
  console.log("Writing back ", inputfile);
}
var stream = fs.createWriteStream(inputfile);
stream.once('open', function(fd) {
  stream.write(outputJsonString);
  stream.end();
  if (verbose) {
    console.log("Done");
  }
});