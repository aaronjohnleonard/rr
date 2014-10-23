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

router.get('/ping', function(req, res)
{
   test(function(rows) {
      res.send(rows);
   })
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
   console.log('raw time: '+req.body.curTime);
   userCurTime = new Date(+req.body.curTime);
   console.log('user time: '+userCurTime);
   serverCurTime = new Date();
   diff = userCurTime - serverCurTime
   reminderTime = new Date(+req.body.reminderTime)
   adjustment = reminderTime-diff
   adjustedTime = new Date(adjustment)
   console.log('adjusted time: '+adjustedTime);
   adjustedTimeString = '"'+adjustedTime.getFullYear()+'-'+(adjustedTime.getMonth()+1)+'-'+adjustedTime.getDate()+' '+adjustedTime.getHours()+':'+adjustedTime.getMinutes()+':'+adjustedTime.getSeconds()+'"'
   console.log('adjusted time string: '+adjustedTimeString);
   insertReminder(req.body.text, req.body.originatingUser, req.body.destinationUser, adjustedTimeString, res)
});

router.post('/addFriend', function(req, res) 
{
   insertUser(req.body.firstName, req.body.lastName);
   connection.query('SELECT LAST_INSERT_ID();', function(err, last_insert_rows) {
      var friendId = last_insert_rows[0]["LAST_INSERT_ID()"];
      getDevice(req.body.phone, function(err, rows) {
         if(err){
            console.log(err);
            res.send(err);
         }
         if(rows.length){
            addDeviceToUser(friendId, rows[0].id, res)
            res.send('success');
         }
         else{
            insertDevice(req.body.phone, null);
            connection.query('SELECT LAST_INSERT_ID();', function(err, last_insert_rows) {
               var deviceId = last_insert_rows[0]["LAST_INSERT_ID()"];
               addDeviceToUser(friendId, deviceId, res);
               res.send('success');
            });
         }
      });
      insertFriendship(req.body.userId, friendId);
   })

});

router.get('/getUser', function(req, res)
{
   console.log('looking for user '+req.query.userId);
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
   console.log('creating a new user with ',req.body.firstName, req.body.lastName, req.body.phone, req.body.deviceKey);
   insertUser(req.body.firstName, req.body.lastName, req.body.phone, req.body.deviceKey)
   connection.query('SELECT LAST_INSERT_ID();', function(err, last_insert_rows) {
      id = last_insert_rows[0]["LAST_INSERT_ID()"];
      console.log("Sending "+id.toString())
      res.send(id.toString());
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

function insertUser(firstName, lastName, phoneNumber, deviceKey, res)
{
   console.log('INSERT INTO user (first_name,last_name) values ("'+firstName+'","'+lastName+'");');
   connection.query('INSERT INTO user (first_name,last_name) values ("'+firstName+'","'+lastName+'");', function(err, rows){
      if(err){
         console.log(err)
      }
   });
   if(phoneNumber){
      connection.query('SELECT LAST_INSERT_ID();', function(err, last_insert_rows) {
         var userId = last_insert_rows[0]["LAST_INSERT_ID()"];  
         console.log('just about to insert device');
         insertDevice(phoneNumber, deviceKey);
         connection.query('SELECT LAST_INSERT_ID();', function(err, last_insert_rows) {
            var deviceId = last_insert_rows[0]["LAST_INSERT_ID()"];
            addDeviceToUser(userId, deviceId);
         });
      });
   }
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
function insertDevice(phoneNumber, deviceKey)
{
   if(deviceKey){
      deviceKey = deviceKey.replace(/[<>\s]/g, '');
   }
   console.log('INSERT INTO device (phone_number, device_key) values("'+phoneNumber+'","'+deviceKey+'");')
   connection.query('INSERT INTO device (phone_number, device_key) values("'+phoneNumber+'","'+deviceKey+'");');
}
function addDeviceToUser(userId, deviceId)
{
   console.log('INSERT INTO user_device (user_id, device_id) values("'+userId+'","'+deviceId+'");');
   connection.query('INSERT INTO user_device (user_id, device_id) values("'+userId+'","'+deviceId+'");');
}
function getDevice(phoneNumber, callback)
{
   connection.query('SELECT * FROM device WHERE phone_number="'+phoneNumber+'"', callback);
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
function test(callback)
{
   connection.query('show tables', function(err, rows) {
      if(err){
         console.log(err);
      }
      callback(rows)
   });
}

module.exports = router;



