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
    waitTimeout:20000,
    onWaitTimeout:function(time){
        this.echo("等待超时！！！！");
        casper.savePicture();
        this.exit();
    }
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
};

casper.checkPageSize = function(response,pageSize){

    var normalObject = JSON.parse(PageInfo[response.index]);

    console.log("拉过一屏图强以后页面大小:" + pageSize,normalObject['size']* 0.9);

    if(pageSize > normalObject['size'] * 0.9){
        this.echo("页面正常!");
        //this.throwError(response);
        //this.savePicture();注释掉，页面正常不用截图
    }else{
        this.throwError(response);
    }
};

casper.savePicture = function(){
    this.capture('./errorImage/'+this.page.title + new Date() + '.jpg', undefined,{
        quality: 60
    });
};

casper.throwError = function(response){
    var txt = '';
    if(response.status != 200){
        txt = '页面状态码:'+response.status
    }else{
        txt = '页面大小小于初始化的80%！！！！'
    }
    this.echo(txt);
    //请求
    this.thenOpen('http://www.mogujie.com/haitao_monitor_index/alarmTest',{
        method: "post",
        data: {
            url: response.url,
            txt: txt
        }
    },function(data) {
        this.debugPage();
    });
    this.savePicture();
};

casper.selectMode = function (response){
    if(this.exists('.J_scroll_wallbox')){
        this.scrollToBottom();
        this.checkAjax(response);
    }else{
        this.getContent(response);
    }   
};

casper.checkAjax = function(response){
    
    this.waitFor(function(){
        return this.evaluate(function(){
            var step = 500;
            var currentTop = document.body.scrollTop;
            var _scrollTop = currentTop;
            currentTop += step;
            window.scrollTo(0,currentTop);
            var tuanItemLength = document.getElementsByClassName('tuan_goods_single').length||document.getElementsByClassName('tuan_goods_single_09292300').length;
            var wallItemLength = (document.getElementsByClassName('iwf').length || tuanItemLength);
            console.log("scrollTop:"+currentTop,"item数:"+wallItemLength);
            return wallItemLength > 40;
        });
    }); 
    this.getContent(response);
};


casper.checkPage = function(response) {
    if(response.status==200){
        this.echo('页面title: ' + this.getTitle());
        this.echo('首屏页面大小:' + this.getPageContent().length);
        this.selectMode(response);
    }else{
        this.throwError(response);
    }
};

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
};

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
