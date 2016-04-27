var envVar = process.env.TOPIC_EXPIRE_DAYS;
var expireMs = 0;
var Topics = module.parent.require('./topics');
const async = require('async');
const _ = require('lodash');


if (Number(envVar) && Number(envVar) > 0){
    expireMs = Number(envVar) * 24*60*60*1000;
}else{
    expireMs = false;//don't expire
}


var Plugin = {
    
    filterTopic: function(thread,next) {
        //throw an error if expired and delete it :(
        if (expireMs){
            console.log('filterTopic:',thread);
            
            if(isExpired(thread.lastposttime)){
                deleteThread(thread,function(){
                    return next(new Error("We're sorry, that thread is past expiration and is is deleted.  Sorry for the inconvenience."),thread);
                });
            }else{
                return next(null,thread);
            }
            
        }else{//don't expire it
            return next(null,thread);
        }
    },
    
    filterTopics: function(data,next){
        if (expireMs){
            console.log('filterTopics:',data);
            
            var newTopics = [];
            var toArchive = [];
            
            data.topics.forEach(function(thread){
                if (isExpired(thread.lastposttime) ){
                    //don't push it
                    toArchive.push(thread);
                }else{
                    newTopics.push(thread)
                }
            });
            
            //archive em
            async.each(toArchive,deleteThread,function(err){
                _.extend(data,{topics:newTopics});
                return next(err,data);
            });
            
            
        }else{//don't expire it and keep a'movin
            return next(null,data);
        }
    }, 
    
    filterCategoryTopics: function(data,next){
        return Plugin.filterTopics(data,next);
    }
}

module.exports = Plugin;

//determine whether something is expired
function isExpired(timestamp){
    if (!expireMs){
        return false;//not expired
    }
    
    if (!timestamp || typeof timestamp !== 'number'){
        return false;//not expired because not a number
    }
    
    if (new Date().getTime() > timestamp + expireMs){
        //time now is past timestamp plus expire ms
        return true
    }else{
        return false;
    }
}

//works with async :)
function deleteThread(thread,callback){
    if (thread.tid || thread.tid === 0){
        thread.deleted = true;//modify the thread by reference.
        Topics.delete(thread.tid,null,function(er,data){
            if (er){//error
                return callback(er);
            }else{//ok
                return callback(null);
            }
        });
    }else{
        return callback(new Error('Cannot delete this thread as it has no <tid> property'));
    }
}