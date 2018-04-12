#!groovy

try
{
 environment {
        SHINE_URL = ''
    }





stage('InstallShine'){
println("Start Installation of SHINE")
node('XSASystem'){
  
  def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
  env.SHINE_URL = SHINEURL
  println("SHINE URL =  ${env.SHINE_URL}") 

}

}



 def shell = {
    bat(returnStdout: true, script: "sh -x -c \"${it}\"").trim()
}

 stage('VyperTests'){
println("Trigger Vyper tests")
node('WinVyper'){
 shell ("rm -rf /c/Users/i302582/shine-test")
 shell( "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /c/Users/i302582/shine-test")
 shell("sed -i 's/<USER_NAME>/$XSAUSER/' /c/Users/i302582/shine-test/conf.js")
 shell("sed -i 's/<PASSWORD>/$XSAPASSWORD/' /c/Users/i302582/shine-test/conf.js")   
 shell("sed -i 's,<SHINEURL>,${env.SHINE_URL},' /c/Users/i302582/shine-test/conf.js")    
 shell ("rm -rf /c/Users/i302582/VyperResults.log")
 def St = shell("node /c/Users/i302582/Vyper4All-Internal/protractor/bin/protractor /c/Users/i302582/shine-test/conf.js | grep '^Total'")
 println("$St")
 Status = St.split();
 println("Status $Status")
 def failed = Status[16]
 def total_failed = failed.toInteger()
 println("$total_failed")
 if( total_failed > 0)
 {
  currentBuild.result = 'FAILURE'
 }
 else
 {
  println ("Vyper tests passed")
 }


 
 
}
   
 }


}

catch(Exception ex)
{
  println(ex)
}

finally

{

}
