var Config = module.exports = {
    jwt: "123",
    core_node:"core-node",
    core_xsjs:"core-xsjs",
    user_xsjs:"user-xsjs",
    
    set_jwt: function(str){
    	Config.jwt=str;
    },
    set_core_node: function(str){
    	Config.core_node= str;
    },
    set_core_xsjs: function(str){
    	Config.core_xsjs=str;
    },
    set_user_xsjs: function(str){
    	Config.user_xsjs=str;
    }
};
