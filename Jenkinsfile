#!groovy

try
{

 stage('WinVyp'){
println("Install Nodejs and Vyperfor Vyper")
node('WinVyper'){
def shell(command) {
    return bat(returnStdout: true, script: "sh -x -c \"$pwd\"").trim()
}
}
   
 }
  

}

catch(Exception ex)
{
  println("Exception")
}
