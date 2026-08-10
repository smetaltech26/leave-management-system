// src/services/emailService.js

// You can set this in your .env file as VITE_GAS_EMAIL_URL
// For now, if it's not set, we'll just log it so the app doesn't crash before you deploy it.
const GAS_URL = import.meta.env.VITE_GAS_EMAIL_URL || '';

/**
 * Sends an email notification using the Google Apps Script backend.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - HTML body of the email
 */
export const sendEmailNotification = async ({ to, subject, body }) => {
  if (!to) {
    console.error('sendEmailNotification: Missing recipient email address.');
    return;
  }

  if (!GAS_URL) {
    console.warn('sendEmailNotification: VITE_GAS_EMAIL_URL is not configured. Email not sent.', { to, subject });
    return;
  }

  try {
    // We send this in the background, without waiting for the UI to block
    fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors', // Important for GAS to avoid CORS issues in some setups
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS often works better with text/plain for CORS
      },
      body: JSON.stringify({ to, subject, body }),
    }).catch(err => {
      console.error('Failed to send email silently:', err);
    });
    
    // We assume it's successful since it's fire-and-forget
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
