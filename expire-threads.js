var envVar = process.env.TOPIC_EXPIRE_DAYS;
var expireMs = 0;
var Topics = module.parent.require('./topics');
const async = require('async');


if (Number(envVar) && Number(envVar) > 0){
    expireMs = Number(envVar) * 24*60*60*1000;
}else{
    expireMs = false;//don't expire
}


var Plugin = {
    
    filterTopic: function(data,next) {
        //throw an error if expired and delete it :(
        if (expireMs){
            
            //console.log('filterTopic:',data);
            var thread = data.topic;
            
            if( !isDeleted(thread) && !isPinned(thread) && isExpired(thread.lastposttime) ){
                deleteThread(thread,function(){
                    return next(new Error("We're sorry, that thread is past expiry and was deleted.  Sorry for the inconvenience."));
                });
            }else{
                return next(null,data);
            }
            
        }else{//don't expire it
            return next(null,data);
        }
    },
    
    filterTopics: function(data,next){
        if (expireMs){
            //console.log('filterTopics:',data);
            
            var toArchive = [];
            
            data.topics.forEach(function(thread){
                if ( !isDeleted(thread) && !isPinned(thread) && isExpired(thread.lastposttime) ){
                    //delete it in a minute
                    toArchive.push(thread);
                }
            });
            
            //archive em
            async.each(toArchive,deleteThread,function(err){
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
        return false;//not expired because we're not set to expire anything
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

//check the 'deleted' property
function isDeleted(thread){
    return !!thread.deleted;
}

//check the pinned property
function isPinned(thread){
    return !!thread.pinned;
}

//works with async :)
function deleteThread(thread,callback){
    if (thread.tid || thread.tid === 0){
        console.log('deleting thread '+thread.tid+' because of expiry');
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