<?php


if($_SERVER["REQUEST_METHOD"] == "POST")
{
    /*
    fileName
    fileSize
    fileType
    slicesCount
    sliceIndex
    fileData
    */

    $uploadDir = "uploads/";
    $fileName = $_POST["uploadId"] . "_" . $_POST["fileName"] ;

    if($_POST["sliceIndex"]+1 <= $_POST["slicesCount"]){
        $data = base64_decode(explode(';base64,', $_POST["fileData"])[1]);
        file_put_contents($uploadDir . $fileName . ".temp", $data, FILE_APPEND);    
    }
    
    if($_POST["sliceIndex"]+1 == $_POST["slicesCount"]){
        rename($uploadDir.$fileName.".temp", $uploadDir.$fileName);
        $response = [
            "fileName" => $fileName
        ];
        echo json_encode($response);
    }
}

?>