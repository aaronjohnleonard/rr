   var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var connection = mysql.createConnection({
   host         : 'localhost',
   user         : 'root',
   password     : 'english33'
});
connection.query('USE reminders');

/* GET home page. */
router.get('/', function(req, res) 
{
  res.render('index', { title: 'Express' });
});

router.get('/getFriends', function(req, res)
{
   getFriends(req.query.userId, function(err, rows) {
      res.send(rows);
   });
});

router.post('/newFriendship', function(req, res)
{
   insertFriendship(req.body.user, req.body.friend, res)
});

router.post('/newReminder', function(req, res)
{
   userCurTime = new Date(req.body.curTime);
   //console.log("user raw: "+req.body.curTime)
   //console.log("user: "+userCurTime)
   serverCurTime = new Date();
   //console.log("server: "+serverCurTime)
   diff = userCurTime - serverCurTime
   //console.log("diff: "+diff)
   reminderTime = new Date(req.body.reminderTime)
   //console.log("reminderTime raw: "+req.body.reminderTime)
   //console.log("reminderTime: "+reminderTime)
   adjustment = reminderTime-diff
   //console.log("adjustment: "+adjustment)
   adjustedTime = new Date(adjustment)
   //console.log("adjustedTime: "+adjustedTime)
   adjustedTimeString = '"'+adjustedTime.getFullYear()+'-'+(adjustedTime.getMonth()+1)+'-'+adjustedTime.getDay()+' '+adjustedTime.getHours()+':'+adjustedTime.getMinutes()+':'+adjustedTime.getSeconds()+'"'
   //console.log(adjustedTimeString)
   insertReminder(req.body.text, req.body.originatingUser, req.body.destinationUser, adjustedTimeString, res)
});

router.post('/addFriend', function(req, res) 
{
   getUser(req.body.phone, function(err, rows){
      if(err){
         console.log(err);
         res.send(err);
      }
      if(rows.length){
         insertFriendship(req.body.userId, rows[0].id, res)
      }
      else{
         insertUser(req.body.firstName, req.body.lastName, req.body.phone, 0)
         getUser(req.body.phone, function(err, rows) {
            console.log("assigning user " + req.body.userId + " to friend " + rows[0].id)
            insertFriendship(req.body.userId, rows[0].id, res)
         })
      }
   })

});

router.post('/newUser', function(req, res) 
{
   getUser(req.body.phone, function(err, user_rows){
      insertUser(req.body.firstName, req.body.lastName, req.body.phone, 1)
      connection.query('SELECT LAST_INSERT_ID();', function(err, last_insert_rows) {
         id = last_insert_rows[0]["LAST_INSERT_ID()"]
         console.log("Sending "+id.toString())
         res.send(id.toString());
         if(user_rows.length){
            for (var i = 0; i < user_rows.length; i++) {
               console.log("deleting "+user_rows[i].id)
               updateId(user_rows[i].id, id)
            };
         }
      })
   })
});

function insertUser(firstName, lastName, phoneNumber, hasApp, res)
{
   connection.query('INSERT INTO user (first_name,last_name,phone_number, has_app) values ("'+firstName+'","'+lastName+'","'+phoneNumber+'",'+hasApp+');', function(err, rows){
      if(err){
         console.log(err)
      }
      else if (res){
         res.send("success")
      }
   });
}
function insertFriendship(userId, friendId, res)
{
   console.log('INSERT INTO user_user (user_id, friend_id) values ('+userId+','+friendId+')');
   connection.query('INSERT INTO user_user (user_id, friend_id) values ('+userId+','+friendId+')', function(err, rows){
      if(err){
         console.log(err)
      }
      else if (res){
         res.send("success")
      }
   });
}
function insertReminder(text, originatingUser, destinationUser, reminderTime, res)
{
   connection.query('INSERT INTO reminder (text, originating_user, destination_user, origination_time, reminder_time) values ('+text+','+originatingUser+','+destinationUser+",NOW(),"+reminderTime+')', function(err, rows){
      if(err){
         console.log(err)
      }
      else if (res){
         res.send("success")
      }
   });
}
function getUser(phoneNumber, callback)
{
   connection.query("SELECT * FROM user WHERE phone_number='"+phoneNumber+"'", callback);
}
function getFriends(id, callback)
{
   connection.query("SELECT user.id, user.first_name, user.last_name FROM user_user INNER JOIN user ON user_user.friend_id=user.id WHERE user_user.user_id = "+id, callback)
}
function updateId(formerId, newId)
{
   connection.query("UPDATE user_user SET friend_id="+newId+" WHERE friend_id="+formerId)
   connection.query("UPDATE reminder SET destination_user="+newId+" WHERE destination_user="+formerId)
   connection.query("DELETE FROM user WHERE id="+formerId)
   console.log("Deleted user "+formerId)
}

module.exports = router;



