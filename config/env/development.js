module.exports = {

   // If you want to debug regression tests, you will need the following which is also in the test config:
   zapHostName: "<zaproxy-interface>",
   zapPort: "8080",
   // Required from Zap 2.4.1. This key is set in Zap Options -> API _Api Key.
   zapApiKey: "<zap-api-key>",
   // Required if debugging security regression tests.
   zapApiFeedbackSpeed: 5000 // Milliseconds.
};