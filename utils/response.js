const sendResponse = (res, statusCode, message, data = null) => {
    const response ={
        success: statusCode >= 200 && statusCode < 300,
        message,
    } 
     if (data !== null) response.data = data;

    return res.status(statusCode).json(response);
    
};
module.exports = sendResponse; 



//  404 — does not have data 
// {
//     "success": false,
//     "message": "Student not found"
// }

// 200 — does have data 
// {
//     "success": true,
//     "message": "Student fetched successfully",
//     "data": { ... }
// }