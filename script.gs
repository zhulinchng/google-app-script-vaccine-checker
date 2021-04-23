/* Author: Ch'ng Zhu Lin
* Feedback: DM me on instagram @czl.my
*=========================================
*      MALAYSIA VACCINE CHECKER
*=========================================
* 
* This script is designed to automatically query for vaccine status until 2nd dose is completed.
* Please verify details at https://www.vaksincovid.gov.my/en/check-status/ before tweaking the settings.
* Query frequency will depend on how frequent it is set. Available query frequency are 1, 3, 6, 9, 12, 24, 48, 72 hours.
*
*=========================================
*       INSTALLATION INSTRUCTIONS
*=========================================
* For new editor
* 1) Click in the menu "Overview" (i icon) > "Make a copy" and make a copy to your Google Drive
*
* For legacy editor
* 1) Click in the menu "File" > "Make a copy..." and make a copy to your Google Drive
*
* 2) Change lines 30-33 to be the settings that you want to use
* 3) Click in the menu "Run" > "Run function" > "Install" and authorize the program
*
* **To stop Script from running click in the menu "Run" > "Run function" > "Uninstall"
*
*=========================================
*               SETTINGS
*=========================================
*/

var icnum = '991122338888'; // Enter IC number without dashes (e.g. 991122338888)
var phnum = '60123456789'; // Enter phone number with country code (e.g. 60123456789)
var howFrequent = 24;     // What interval (hours) to run this script on to check for new events (1, 3, 6, 9, 12, 24, 48, 72)
var receipient = 'example@example.com'; // Enter email address to send the notification to. (e.g. example@example.com)

//=====================================================================================================
//!!!!!!!!!!!!!!!! DO NOT EDIT BELOW HERE UNLESS YOU REALLY KNOW WHAT YOU'RE DOING !!!!!!!!!!!!!!!!!!!!
//=====================================================================================================

var subject = 'Script is executed.';
var body = 'Script executed.';
var status = ''; 

function Install(){
  //Delete any already existing triggers so we don't create excessive triggers
  DeleteAllTriggers();
  
  //Custom error for restriction here: https://developers.google.com/apps-script/reference/script/clock-trigger-builder#everyMinutes(Integer)
  var validFrequencies = [1, 3, 6, 9, 12, 24, 48, 72];
  if(validFrequencies.indexOf(howFrequent) == -1)
    throw "[ERROR] Invalid value for \"howFrequent\". Must be either 1, 3, 6, 9, 12, 24, 48, 72";

  ScriptApp.newTrigger("main").timeBased().everyHours(howFrequent).create();
  subject = 'Vaccine Checker Script set for '+icnum +' ('+phnum+').';
  body = 'Script is set for '+ icnum +' ('+phnum+') for every '+ howFrequent.toString() +' hour(s).'+'Please verify details at https://www.vaksincovid.gov.my/en/check-status/ to avoid errors. For the vaccine checker script code, please visit https://script.google.com/d/1uQxdjwZ_cNMygdZ9atGGgyJQ-0rd80tkC3P8uWnYIxPvs3X3-Q8HKlaP/edit .';
  MailApp.sendEmail(receipient,subject,body);
}

function Uninstall(){
  DeleteAllTriggers();
}

function DeleteAllTriggers(){
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++){
    if (triggers[i].getHandlerFunction() == "main"){
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function main() {
  var wnme = icnum + "-bsep-" + phnum;
  var url = 'https://bbzzv0e9ja.execute-api.ap-southeast-1.amazonaws.com/default/westfunction?name=' + wnme;
  var response = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  if (response.message == "Internal Server Error") {
    status = 'OK';
    subject = 'Server Error';
    body = 'Server Error, check API';
  }
  if (response.res == 'inprocess') {
    status = 'OK';
    subject = 'Vaccine appointment in process for '+String(response.appt_name) +'.';
    body = 'Appointment status in process, script is set to automatically check for status of '+ String(response.appt_name) + ' every '+ howFrequent.toString() +' hour(s). Kindly note that your appointment details will only be updated 14 day(s) before your scheduled vaccination date.';
    if (response.appt_difftime1 != "") {
      if (parseInt(response.appt_difftime1) <= 14) {
        subject = 'Vaccine Appointment in ' + String(response.appt_difftime1) + ' day(s) for '+String(response.appt_name)+'.';
        body = 'Please check MySejahtera App. '+ 'Appointment for ' + String(response.appt_name) + ' ('+String(response.appt_id) +') for 1st dose for date '+ String(response.appt_date1) + ' '+ String(response.appt_time1) + ' at location ' + String(response.appt_facility1) + ' ('+ String(response.appt_location1)+')';
      }
      if (response.appt_complete1 == "1") {
        status = '';
      }
    } 
    if (response.appt_difftime2 != "" && response.appt_complete1 == "1") {
      status = 'OK';
      if (parseInt(response.appt_difftime2) <= 14) {
        subject = 'Vaccine Appointment in ' + String(response.appt_difftime2) + ' day(s) for '+String(response.appt_name)+'.';
        body = 'Please check MySejahtera App. '+ 'Appointment for ' + String(response.appt_name) + ' ('+String(response.appt_id) +') for 2nd dose for date '+ String(response.appt_date2) + ' '+ String(response.appt_time2) + ' at location ' + String(response.appt_facility2) + ' ('+ String(response.appt_location2)+')';
      }
      if (response.appt_complete2 == "1") {
        subject = 'Vaccination completed for '+String(response.appt_name);
        body = '2-dose vaccination completed for '+String(response.appt_name)+'. This will be the last email.';
        DeleteAllTriggers();
      }
    }
  }
  if (response.res == 'noreg') {
    status = 'OK';
    subject = String(response.appt_name)+' has not registered for Vaccination';
    body = 'For any further enquiries regarding your vaccination appointment, or if you are unable to proceed with your scheduled appointment, please call the National COVID-19 Vaccination Registration Line 1800-888-828.';
  }
  if (response.res == 'wrongphone') {
    status = 'OK';
    subject = 'Wrong IC or Phone Number';
    body = 'Wrong IC or Phone Number set for '+ String(icnum)+' ('+String(phnum) +')'+', check script settings or ic/phone registered.';
  }
  if (status == 'OK'){
    MailApp.sendEmail(receipient,subject,body);
  }
}
