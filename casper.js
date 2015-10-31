var utils = require("utils");

var fs = require("fs");

// var _ = require("underscore")._;

var casper = require("casper").create({
    pageSettings:{
        loadImages:  false,        
        loadPlugins: true,
        userAgent:'mogujie'
    },
    logLevel: "debug",   // Only "info" level messages will be logged
    verbose: true,
    //viewportSize:{width: 1200, height: 800},
    waitTimeout:40000
});

var pathStr = casper.cli.get(0);

var links = pathStr.split(',');

var PageInfo = [];

var resultPath = "./files/result.js";

var needRewrite = true;

var writeText = '';

casper.getContent = function(response){
    this.wait(5000,function(){
        var pageSize = this.getPageContent().length;
        if(needRewrite){
            var writeObject = {
                url : response.url,
                title : this.page.title,
                size : pageSize
            }
            writeText += JSON.stringify(writeObject)+'\n';
        }else{
            this.checkPageSize(response,pageSize);
        }
    });
}

casper.checkPageSize = function(response,pageSize){

    var normalObject = JSON.parse(PageInfo[response.index]);

    console.log("拉过一屏图强以后页面大小:" + pageSize,normalObject['size']* 0.9);

    if(pageSize > normalObject['size'] * 0.9){
        this.echo("页面正常!");
        this.savePicture();
    }else{
        this.throwError(response);
    }
}

casper.savePicture = function(){
    this.capture('./errorImage/'+this.page.title + new Date(), undefined,{
        format: 'jpg',
        quality: 60
    });
}

casper.throwError = function(response){

    this.savePicture();
    //请求
    
}

casper.selectMode = function (response){
    if(this.exists('.J_scroll_wallbox')){
        this.scrollToBottom();
        this.checkAjax(response);
    }else{
        this.getContent(response);
    }   
}

casper.checkAjax = function(response){
    
    this.waitFor(function(){
        return this.evaluate(function(){
            console.log(document.getElementsByClassName('iwf').length);
            return document.getElementsByClassName('iwf').length > 40;
        });
    }); 

    this.getContent(response);

}


casper.checkPage = function(response) {
    if(response.status==200){
        this.echo('页面title: ' + this.getTitle());
        this.echo('首屏页面大小:' + this.getPageContent().length);
        this.selectMode(response);
    }else{
        this.throwError(response);
    }
}

casper.initPageSize = function(){
    if (fs.exists(resultPath)) {
        var resultContent = fs.read(resultPath,"UTF-8");
        resultContent = resultContent.replace(/\n$/,'');
        PageInfo = resultContent.split('\n');

        if(PageInfo.length == links.length){
            needRewrite = false;
        }
    }else{
        fs.write(resultPath,'','w');
    }
}

casper.start().then(function(){

    this.initPageSize(resultPath);

});

casper.each(links,function(self,link,index){
    this.thenOpen(link, function(response) {
        this.echo('--- Link ' + link + ' ---');
        response.index = index;
        this.checkPage(response);
    });
});

casper.page.onConsoleMessage = function(e) {
  console.log("CONSOLE",e);
};

casper.run(function(){
    if(needRewrite){
        fs.write(resultPath,writeText,'w');
        this.echo("初始化完成！");
    }
    this.echo("All done.");
    this.exit();
});
