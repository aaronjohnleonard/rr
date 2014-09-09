var express = require('express');
var router = express.Router();
var mysql = require('mysql');

router.get('/newUser', function(req, res) {
      
      var connection = mysql.createConnection({
      host         : 'localhost',
      user         : 'root',
      password     : 'english33'
   });

   connection.query('USE reminders');
   connection.query('INSERT INTO user (first_name,last_name,phone_number) values ("aaron","leonard","555-5555")');
   res.send("success");

});

module.exports = router;

