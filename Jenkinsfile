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
 shell("node /c/Users/i302582/Vyper4All-Internal/protractor/bin/protractor /c/Users/i302582/shine-test/conf.js > /c/Users/i302582/VyperResults.log")

 
 

 
 
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
