var utils = require("utils");

var fs = require("fs");

var casper = require("casper").create({
    pageSettings:{
        loadImages:  false,        
        loadPlugins: true,
        userAgent:'mogujie'
    },
    logLevel: "debug",   // Only "info" level messages will be logged
    verbose: true,
    viewportSize:{width: 1366, height: 768},
    waitTimeout:40000
});

var pathStr = casper.cli.get(0);

var links = pathStr.split(',');

// The base links array
 
var currentLink = 0;

var PageSize = [];

function getContent (){
    this.wait(5000,function(){
        //PageSize.
        this.echo('Page content length: ' + this.getPageContent().length);
        checkPageSize.call(this);
    });
}

function checkPageSize (){
    

}

function savePicture (){
    this.capture(this.page.title, undefined,{
        format: 'jpg',
        quality: 75
    });
}

function throwError(){
    savePicture.call(this);
    //请求

}

function openPage(link) {
    this.start(link, function(response) {
        if(response.status==200){
            this.echo('Page title: ' + this.getTitle());
            this.echo(this.getPageContent().length);
            getContent.call(this);
        }else{
            throwError.call(this,this.getTitle());
        }
    });
}

function check (){
    if (links[currentLink]) {
        this.echo('--- Link ' + currentLink + ' ---');
        openPage.call(this, links[currentLink]);
        currentLink++;
        this.run(check);
    } else {
        this.echo("All done.");
        this.exit();
    }
}

casper.start(function(){
    //this.echo(111111);
}).then(function() {
    
});


casper.page.onConsoleMessage = function(e) {
  console.log("CONSOLE",e);
};

// var resultPath = "./files/result.js";
// if(fs.existsSync(resultPath)){
//     var resultContent = fs.readFileSync(filePath,"UTF-8");
// }else{
//     fs.appendFile(resultPath,"9999\n");
// }

casper.run(check);
