var mysql = require('mysql');

var db_config = {
   host     : 'us-cdbr-iron-east-01.cleardb.net',
   user     : 'bf491532417c27',
   password : 'b2fff196'
};

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(db_config);

    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
          console.log('error when connecting to db:', err);
          setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });  

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
          handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
          throw err;                                  // server variable configures this)
        }
    });

    connection.query('USE heroku_466f3f976236f66');
}

handleDisconnect();

// Twilio Credentials 
var accountSid = 'AC0884af1dd8f5d21d96239238558a056c'; 
var authToken = '2c1e24966e48e23ee3ac1885ec082b97'; 
 
//require the Twilio module and create a REST client 
var client = require('twilio')(accountSid, authToken); 

var infinite = function() {
	console.log("checking at " + new Date())

	connection.query("SELECT reminder.id, reminder.text, dest_user.phone_number, orig_user.first_name, orig_user.last_name FROM reminder JOIN user orig_user ON reminder.originating_user=orig_user.id JOIN user dest_user ON reminder.destination_user=dest_user.id WHERE reminder_time <= NOW() AND !has_been_sent;", function(err, rows){
		for (var i = 0; i < rows.length; i++) {
			connection.query("UPDATE reminder SET has_been_sent=1 WHERE id="+rows[i].id, function(err, rows){
				if (err)
				{
					console.log(err)
				}
			});

			console.log("Sending reminder")

			client.messages.create({ 
				to: rows[i].phone_number, 
				from: "+13852356308", 
				body: "This is a reminder from Remote Reminders:\n"+rows[i].text+"\nSent from "+rows[i].first_name+" "+rows[i].last_name,
			}, function(err, message) { 

			});
		};
	})

	setTimeout(infinite, 60000);
}

infinite();
