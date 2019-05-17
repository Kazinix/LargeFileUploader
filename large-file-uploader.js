var LargeFileUploader = (function(){

    function uuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid)};

    function LargeFileUploader()
    {
        var _this = this;

        var _UNSTARTED      = "UNSTARTED",
            _STARTING       = "STARTING",
            _UPLOADING      = "UPLOADING",
            _UPLOADED       = "UPLOADED",
            _PAUSING        = "PAUSING",
            _PAUSED         = "PAUSED",
            _RESUMING       = "RESUMING",
            _CANCELLING     = "CANCELLING",
            _CANCELLED      = "CANCELLED",
            _FINISHED       = "FINISHED",
            _ERROR          = "ERROR",
            _RETRYING       = "RETRYING";

        var _STATUSCHANGE   = "STATUSCHANGE"

        var _callbacks      = { };

        _callbacks[_UNSTARTED]      = [];
        _callbacks[_STARTING]       = [];
        _callbacks[_UPLOADING]      = [];
        _callbacks[_UPLOADED]       = [];
        _callbacks[_PAUSING]        = [];
        _callbacks[_PAUSED]         = [];
        _callbacks[_RESUMING]       = [];
        _callbacks[_CANCELLING]     = [];
        _callbacks[_CANCELLED]      = [];
        _callbacks[_FINISHED]       = [];
        _callbacks[_ERROR]          = [];
        _callbacks[_RETRYING]       = [];
        _callbacks[_STATUSCHANGE]   = [];

        var _status         = _UNSTARTED;

        var _file, 
            _url,
            _sliceSize      = 10000 * 1024,
            _retryOnError   = true,
            _maxRetry       = 3;

        var _uploadId;

        var _retryCount     = 0;
        var _slicesCount    = 0;
        var _sliceIndex     = 0;

        var _fileReader     = new FileReader();

        this.getStatus = function(){ return _status; };

        this.getFile = function(){ return _file; };
        this.setFile = function(file){ 
            if(typeof file !== "object" || file.constructor.name !== "File"){
                throw "Invalid type for file.";
            }

            _file = file;

            _retryCount = 0;
            _sliceIndex = 0;
            _uploadId   = uuid();
            
            changeStatus(_UNSTARTED, {});
        };
        
        this.getUrl = function(){ return _url; };
        this.setUrl = function(url){
            if(typeof url !== "string"){
                throw "Invalid type for url.";
            }
            _url = url;
        };
        
        this.getSliceSize = function(){ return _sliceSize; };
        this.setSliceSize = function(size){ 
            if(isNaN(size) || size < 1){
                throw "Invalid size for slice size.";
            }
            _sliceSize = size;
        };

        this.getRetryOnError = function(){ return _retryOnError; };
        this.setRetryOnError = function(retryOnError){ 
            if(typeof retryOnError !== "boolean"){
                throw "Invalid type for retry-on-error.";
            }
        };

        this.getMaxRetry = function(){ return _maxRetry; };
        this.setMaxRetry = function(maxRetry){ 
            if(isNaN(maxRetry) || maxRetry < 1){
                throw "Invalid value for max-retry.";
            }
            _maxRetry = maxRetry;
        };
        
        this.start = function(){ 
            if(_status !== _UNSTARTED){
                return;
            }
            changeStatus(_STARTING, {});
            _slicesCount = Math.ceil(_file.size / _sliceSize);
            uploadSlice();
        };

        this.pause = function(){ 
            if(_status !== _UPLOADING){
                return;
            }

            changeStatus(_PAUSING, {});
        };

        this.continue = function(){
            if(_status !== _PAUSED){
                return;
            }

            changeStatus(_RESUMING, {});
            uploadSlice();
        };

        this.cancel = function(){ 
            if(_status !== _UPLOADING 
                && _status !== _PAUSED){
                    return;
                }

            if(_status === _UPLOADING){
                changeStatus(_CANCELLING, {});
            }
            else{
                changeStatus(_CANCELLING, {});
                changeStatus(_CANCELLED, {});
            }
            
        };

        var changeStatus = function(status, detail){
            _status = status;
            dispatchEvent(status, detail);
            dispatchEvent(_STATUSCHANGE, {
                status : status
            });
        };

        var uploadSlice = function(){ 
            
            if(_sliceIndex < _slicesCount){
                if(_status === _STARTING 
                    || _status === _RESUMING 
                    || _status === _RETRYING
                    || _status === _UPLOADED){
                    changeStatus(_UPLOADING, { sliceIndex : _sliceIndex });
                }

                var startingPoint = _sliceIndex * _sliceSize;
                var nextSlice = startingPoint + _sliceSize;
                var blob = _file.slice(startingPoint, nextSlice);
                

                _fileReader.readAsDataURL(blob);
            }
            
        };

        _fileReader.onloadend = function(e){
            if(e.target.readyState !== FileReader.DONE){
                return;
            }

            var uploadData = {
                uploadId: _uploadId,
                fileName: _file.name,
                fileSize: _file.size,
                fileType: _file.type,
                slicesCount: _slicesCount,
                sliceIndex: _sliceIndex,
                fileData: e.target.result
            };
        
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(){
                if(this.readyState === 4){
                    if(this.status === 200){
                        _retryCount = 0;
                        var uploadedEventArgs = { slicesCount : _slicesCount, sliceIndex : _sliceIndex };
                        
                        if(_sliceIndex+1 === _slicesCount){
                            changeStatus(_UPLOADED, uploadedEventArgs);
                            changeStatus(_FINISHED, { responseText : xhr.responseText });
                            return;
                        }
                
                        if(_status === _PAUSING){
                            changeStatus(_UPLOADED, uploadedEventArgs);
                            _sliceIndex++;
                            changeStatus(_PAUSED, {});
                            return;
                        }

                        if(_status === _CANCELLING){
                            changeStatus(_UPLOADED, uploadedEventArgs);
                            _sliceIndex++;
                            changeStatus(_CANCELLED, {});
                            return;
                        }

                        changeStatus(_UPLOADED, uploadedEventArgs);
                        _sliceIndex++;
                        uploadSlice();
                    }
                    else{
                        
                        changeStatus(_ERROR, { statusText : xhr.statusText, responseText : xhr.responseText });

                        if(_status === _CANCELLING){
                            changeStatus(_CANCELLED, {});
                            return;
                        }

                        if(_status === _PAUSING){
                            changeStatus(_PAUSED, {});
                            return;
                        }

                        if(_retryOnError && _retryCount < _maxRetry){
                            _retryCount++;
                            changeStatus(_RETRYING, { retryCount : _retryCount, maxRetry : _maxRetry });
                            uploadSlice();
                        }
                        else{
                            return;    
                        }
                    }
                }
            };
            var encodedUploadData = Object.keys(uploadData).map(function(key) {
                return encodeURIComponent(key) + '=' +
                    encodeURIComponent(uploadData[key]);
            }).join('&');
            xhr.open("POST", _url, true);
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.send(encodedUploadData); 
 
        };

        var dispatchEvent = function(eventName, details){
            for(var i=0; i<_callbacks[eventName].length; i++){
                _callbacks[eventName][i](details);
            }
        };

        this.addEventListener = function(eventName, callback){
            if(typeof callback !== "function"){
                throw "Invalid callback.";
            };
            _callbacks[eventName.toUpperCase()].push(callback);
        };
    };

    return LargeFileUploader;
})();

