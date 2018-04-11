#!groovy

try
{
 environment {
        SHINE_URL = ''
    }




 def shell = {
    bat(returnStdout: true, script: "sh -x -c \"${it}\"").trim()
}

 stage('WinVyp'){
println("Install Nodejs and Vyperfor Vyper")
node('WinVyper'){

 def Status = shell("grep '^Total' VyperResults.log")
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
