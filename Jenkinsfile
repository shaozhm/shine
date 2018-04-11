#!groovy

try
{
 environment {
        SHINE_URL = ''
    }




 def shell = {
    bat(returnStdout: true, script: "sh -x -c \"${it}\"").trim()
}

 stage('VyperTests'){
println("Trigger Vyper tests")
node('WinVyper'){
 def St = shell("node /c/Users/i302582/Vyper4All-Internal/protractor/bin/protractor /c/Users/i302582/shine-test/conf.js | grep '^Total'")
 println("$St")
 
 

 
 
}
   
 }

 stage('VyperResults'){
println("Install Nodejs and Vyperfor Vyper")
node('WinVyper'){

 def Status = shell("grep '^Total' /c/Users/i302582/VyperResults.log")
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
