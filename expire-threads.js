var envVar = process.env.TOPIC_EXPIRE_DAYS;
var expireMs = 0;

if (Number(envVar) && Number(envVar > 0)){
    expireMs = Number(envVar) * 24*60*60*1000;
}else{
    expireMs = false;//don't expire
}


var Plugin = {
    
    filterTopic: function(data,next) {
        if (expireMs){
            console.log('filterTopic:',data);
            return next(null,data);  
        }else{//don't expire it
            return next(null,data);
        }
    },
    
    filterTopics: function(data,next){
        if (expireMs){
            console.log('filterTopics:',data);
            return next(null,data);  
        }else{//don't expire it
            return next(null,data);
        }
    }, 
    
    filterCategoryTopics: function(data,next){
        if (expireMs){
            console.log('filterCategoryTopics:',data);
            return next(null,data);  
        }else{//don't expire it
            return next(null,data);
        }
    }
}

module.exports = Plugin;