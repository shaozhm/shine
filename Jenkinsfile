#!groovy

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
  
