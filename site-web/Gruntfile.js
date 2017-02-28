module.exports=function(grunt){
	grunt.loadNpmTasks('grunt-openui5');
	grunt.initConfig({
		openui5_preload: {
			library: {
				options: {
					resources: 'node_modules/sap-site-entry/public/resources',
					dest: 'node_modules/sap-site-entry/public/resources'
				},
				libraries: 'sap/ushell/adapters/cf'
			}
		}

	});
	grunt.registerTask('default',['openui5_preload']);
};