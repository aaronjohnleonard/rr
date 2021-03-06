var mysql = require('mysql');
var connection = mysql.createConnection({
   host		: 'localhost',
   user		: 'root',
   password	: 'english33'
});

connection.query('USE reminders');

// Twilio Credentials 
var accountSid = 'AC0884af1dd8f5d21d96239238558a056c'; 
var authToken = '2c1e24966e48e23ee3ac1885ec082b97'; 
 
//require the Twilio module and create a REST client 
var client = require('twilio')(accountSid, authToken); 

var infinite = function() {
	console.log("checking at " + new Date())

	connection.query("SELECT reminder.id, reminder.text, user.phone_number, user.first_name, user.last_name FROM reminder INNER JOIN user ON reminder.originating_user=user.id WHERE reminder_time <= NOW() AND !has_been_sent;", function(err, rows){
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
