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
 def St = "Total : 34 specs, 31 Passed, 3 failures"
  //shell("node /c/Users/i302582/Vyper4All-Internal/protractor/bin/protractor /c/Users/i302582/shine-test/conf.js | grep '^Total'")
 println("$St")
 Status = St.split();

 println($Status)

 
 
}
   
 }


}

catch(Exception ex)
{
  println($ex)
}

finally

{
 
}
