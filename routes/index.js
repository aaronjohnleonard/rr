var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var connection = mysql.createConnection({
   host     : 'us-cdbr-iron-east-01.cleardb.net',
   user     : 'bf491532417c27',
   password : 'b2fff196'
});
connection.query('USE heroku_466f3f976236f66');

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
   userCurTime = new Date(+req.body.curTime);
   serverCurTime = new Date();
   diff = userCurTime - serverCurTime
   reminderTime = new Date(+req.body.reminderTime)
   adjustment = reminderTime-diff
   adjustedTime = new Date(adjustment)
   adjustedTimeString = '"'+adjustedTime.getFullYear()+'-'+(adjustedTime.getMonth()+1)+'-'+adjustedTime.getDay()+' '+adjustedTime.getHours()+':'+adjustedTime.getMinutes()+':'+adjustedTime.getSeconds()+'"'
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

router.get('/getUser', function(req, res)
{
   getUserById(req.query.userId, function(err, rows) {
      if(!rows.length){
         res.send(false);
      }
      else {
         res.send(rows);
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

router.get('/getReminders', function(req, res)
{
   getRemindersTo(req.query.userId, function(err, reminderTo_rows) {
      getRemindersFrom(req.query.userId, function(err, reminderFrom_rows) {
         console.log(reminderTo_rows);
         console.log(reminderFrom_rows);
         var allReminders = {to:reminderTo_rows, from:reminderFrom_rows}
         res.send(allReminders);
      })
   })
});

router.get('/removeReminder', function(req, res)
{
   deleteReminder(req.query.reminderId, res);
});   

router.get('/removeFriend', function(req, res)
{
   deleteFriend(req.query.userId, req.query.friendId, res);
});

router.get('/getFriend', function(req, res)
{
   getFriend(req.query.friendId, function(err, rows){
      console.log(rows[0]);
      res.send(rows[0]);
   });
});

router.post('/editFriend', function(req, res)
{
   editFriend(req.body.id, req.body.firstName, req.body.lastName, req.body.phoneNumber, res);
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
   connection.query('INSERT INTO reminder (text, originating_user, destination_user, origination_time, reminder_time) values ("'+text+'",'+originatingUser+','+destinationUser+",NOW(),"+reminderTime+')', function(err, rows){
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
function getUserById(userId, callback)
{
   connection.query("SELECT * FROM user WHERE id='"+userId+"'", callback);
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
function getRemindersFrom(userId, callback)
{
   connection.query("SELECT reminder.id, reminder.text, unix_timestamp(reminder.reminder_time), user.first_name, user.last_name "+
                     "FROM  reminder "+
                     "INNER JOIN  user ON reminder.destination_user = user.id "+
                     "WHERE originating_user='"+userId+"'", callback)
}
function getRemindersTo(userId, callback)
{
   connection.query("SELECT reminder.id, reminder.text, unix_timestamp(reminder.reminder_time), user.first_name, user.last_name "+
                     "FROM  reminder "+
                     "INNER JOIN  user ON reminder.originating_user = user.id "+
                     "WHERE destination_user='"+userId+"'", callback)
}
function deleteReminder(reminderId, res)
{
   connection.query("DELETE FROM reminder WHERE id='"+reminderId+"'");
   console.log("deleting "+reminderId);
   res.send("success");
}
function deleteFriend(userId, friendId, res)
{
   connection.query("DELETE FROM user_user WHERE user_id='"+userId+"' AND friend_id='"+friendId+"'");
   res.send("success");
}
function getFriend(friendId, callback)
{
   console.log("SELECT * FROM user WHERE id='"+friendId+"'")
   connection.query("SELECT * FROM user WHERE id='"+friendId+"'", callback);
}
function editFriend(id, firstName, lastName, phoneNumber, res)
{
   console.log("UPDATE user SET first_name="+firstName+", last_name="+lastName+", phone_number="+phoneNumber+" WHERE id="+id)
   connection.query("UPDATE user SET first_name='"+firstName+"', last_name='"+lastName+"', phone_number='"+phoneNumber+"' WHERE id="+id)
   res.send("success");
}

module.exports = router;



