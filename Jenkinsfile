#!groovy

 environment {
        SHINE_URL = ''
    }


 stage('shineurl'){
println("SHineurl")
node('XSASystem'){
sh "xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:30030 -o myorg -s PROD --skip-ssl-validation"
def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
 env.SHINE_URL = SHINEURL
    println("SHINE URL = {$SHINEURL}") 
 
 
}
   
 }

def shell(command) {
    return bat(returnStdout: true, script: "sh -x -c \"${command}\"").trim()
}

 stage('WinVyp'){
println("Install Nodejs and Vyperfor Vyper")
node('WinVyper'){
 shell ("rm -rf /c/Users/i302582/shine-test")
 shell( "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /c/Users/i302582/shine-test")
 shell("sed -i 's/<USER_NAME>/$XSAUSER/' /c/Users/i302582/shine-test/conf.js")
 shell("sed -i 's/<PASSWORD>/$XSAPASSWORD/' /c/Users/i302582/shine-test/conf.js")   
// shell("sed -i 's,<SHINEURL>,$SHINEURL,' /c/Users/i302582/shine-test/conf.js")    
 shell("node /c/Users/i302582/Vyper4All-Internal/protractor/bin/protractor /c/Users/i302582/shine-test/conf.js") 

 
 
}
   
 }
  
