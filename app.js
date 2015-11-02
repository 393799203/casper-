var schedule = require("node-schedule");
var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");


var nowPath = __dirname;

var rule = new schedule.RecurrenceRule();

//rule.hour = 14;
rule.minute = [0,20,40];
//rule.second = 0;

var scheduleJob = schedule.scheduleJob(rule, function(){
	logDate("start from");

	var fileList = getFiles();

	var childArgs = [
        path.join(nowPath,"casper.js"),
        fileList
    ];

    //console.log(childArgs);

    var child = childProcess.execFile("casperjs", childArgs, function(err, stdout, stderr) {
        if(err) throw err;
        console.log("casperjs success!");
        logDate("end from");
    });

    child.stdout.on('data',function(data){
    	var str = data.toString();
    	console.log(str);
    });

    child.stderr.on('data', function (data) {
    	console.log('stderr: ' + data);
	});

	child.on('exit', function (code) {
	    console.log('child process exited with code ' + code);
	});

    function getFiles(){
        var filePath = path.join(nowPath,"files","fileList_pre1.js");
        var fileListStr = fs.readFileSync(filePath,"UTF-8");
        var fileList = fileListStr.replace(/\n*$/,'').split('\n');
        return fileList;
    }

    function logDate(flag){
        var filePath = nowPath + '/logData.log';
        fs.appendFile(filePath,flag+" "+new Date()+"\n");
    }
});


