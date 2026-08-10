/**
 * Leave Management System - Email Notification Service
 * Deploy this script as a Web App (Execute as: Me, Who has access: Anyone)
 */

function doPost(e) {
  try {
    // Parse the incoming JSON payload
    const payload = JSON.parse(e.postData.contents);
    const to = payload.to;
    const subject = payload.subject;
    const body = payload.body;
    
    // Basic validation
    if (!to || !subject || !body) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Missing 'to', 'subject', or 'body' in request." 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Send email using Google's MailApp
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: body,
      name: "Leave Management System"
    });
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Email sent successfully" 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Handle errors (e.g., invalid JSON, quota exceeded)
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle OPTIONS request for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
