# LargeFileUploader
A JavaScript library for uploading large files in chunks.

## Usage

```javascript
var fileInput = document.getElementById("#fileInput");

var fileUploader = new LargeFileUploader();
fileUploader.setUrl("/upload-large-file.php");

fileInput.addEventListener("change", function(){
  fileUploader.setFile(this.files[0]);
  fileUploader.start();
});
```
The code above automatically uploads parts of the files as soon as the file input changed.

## Properties

Name | Description | Type | Accessors
-- | -- | -- | --
status | The current status of the file uploader. | string | getStatus
url | The receiver of the parts of the file. | string | getUrl, setUrl
sliceSize | Size of the parts in bytes. | int | getSliceSize, setSliceSize
retryOnError | Whether to retry uploading when error occurred. | bool | getRetryOnError, setRetryOnError
maxRetry | How many times the upload will be retried when error occurred. | int | getMaxRetry, setMaxRetry

## Methods

Name | Description 
-- | -- 
start | Starts the upload.   
pause | Pauses the upload. 
continue | Continues the upload when paused. 
cancel | Cancels the upload.
addEventListener | Enables adding listener to pseudo-events

## Statuses and Pseudo-events

Status | Description | Events
-- | -- | --
UNSTARTED | The file has been set and is ready to be started. | unstarted, statuschange
STARTING | Start command has been fired. Readying the upload. | starting, statuschange
UPLOADING | Uploading the file to the server. | uploading, statuschange
UPLOADED | Part of the file has been uploaded successfully. | uploaded, statuschange
PAUSING | Pause command has been fired. Waiting for the right time to pause. | pausing, statuschange
PAUSED | The upload is paused. | paused, statuschange
RESUMING | Continue command has been fired. | resuming, statuschange
CANCELLING | Cancel command has been fired. | cancelling, statuschange
FINISHED | The last part of the file has been uploaded. | finished, statuschange 
ERROR | Upload error. | error, statuschange
RETRYING | An error occurred and is trying to continue the upload. | retrying, statuschange

Please note that these are not real JavaScript events.
