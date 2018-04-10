#!groovy

def shell(command) {
    return bat(returnStdout: true, script: "sh -x -c \"${command}\"").trim()
}

 stage('WinVyp'){
println("Install Nodejs and Vyperfor Vyper")
node('WinVyper'){
 shell("ls")
}
   
 }
  
