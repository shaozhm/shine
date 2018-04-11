#!groovy

try
{
 environment {
        SHINE_URL = ''
    }




stage('InstallShine'){
println("Start Installation of SHINE")
node('XSASystem'){
  sh "xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:30030 -o myorg -s PROD --skip-ssl-validation"
  
  
  def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
  env.SHINE_URL = SHINEURL
  println("SHINE URL =  ${env.SHINE_URL}") 

}

}


 def shell = {
    bat(returnStdout: true, script: "sh -x -c \"${it}\"").trim()
}

 stage('WinVyp'){
println("Install Nodejs and Vyperfor Vyper")
node('WinVyper'){
 shell ("rm -rf /c/Users/i302582/shine-test")
 shell( "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /c/Users/i302582/shine-test")
 shell("sed -i 's/<USER_NAME>/$XSAUSER/' /c/Users/i302582/shine-test/conf.js")
 shell("sed -i 's/<PASSWORD>/$XSAPASSWORD/' /c/Users/i302582/shine-test/conf.js")   
 shell("sed -i 's,<SHINEURL>,${env.SHINE_URL},' /c/Users/i302582/shine-test/conf.js")    
 shell ("rm -rf /c/Users/i302582/VyperResults.log")
 shell("node /c/Users/i302582/Vyper4All-Internal/protractor/bin/protractor /c/Users/i302582/shine-test/conf.js > /c/Users/i302582/VyperResults.log") 
 def Status = shell("grep "^Total" test.log")
 println("Status of Vyper tests is $Status")
 
 

 
 
}
   
 }


}

catch(Exception ex)
{
  
}

finally

{
 
}
