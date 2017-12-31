var connection = new (require('./connection'));
var command = new (require('./commands'))(connection);
var express = require("express");
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

process.stdin.resume();
process.stdin.setEncoding('utf8');

app.get('/api', function (req, res) {
  res.send('OK - server running');
});

app.post('/api', function (req, res) {
  res.send('Denon API is running');
  
  
  var action; 
  action = req.body.result.action;

  if (action === "xbox_on") {
    try {

      connection.connect(process.argv[2] || "192.168.1.137", 23, function() {
        return process.stdout.write("CONNECTED!");
      });

      connection.send("PWON", "");
      connection.send("SIGAME", "");
    }	
    catch (ex) {
      return process.stdout.write("FAILURE TO Turn on the XBOX " + JSON.stringify(ex));
      //return res.send("It broke");
    }
  }
  else {
    try {
      var param; // null ok, param needed
      connection.connect(process.argv[2], 23, function() {} );
      connection.send(action.toUpperCase(), param);
    }
    catch (ex) {
      process.stdout.write("arbitrary action failed: " + action);
    }
  }
});

app.post('/api/:command', function (req, res) {
	connection.connect(process.argv[2] || "192.168.1.137", 23, function() {
	  return process.stdout.write("connected to the receiver\r");
	});

	var param;
	
	try {
	  return res.sendStatus(connection.send(req.params.command.toUpperCase(), param)); 
	}
	catch (ex) {
	  return res.send('Unable to process command: ' + ex);
	}
	
});

app.listen(process.argv[3] || 8000);

process.stdin.on('data', function(chunk) {
  var cmd, param, ref;

  ref = chunk.split(" ").map(function(val) {
    return val.trim();
  }), cmd = ref[0], param = ref[1];
  if (command[cmd]) {
    return command[cmd](param);
  } else {
    try {
	if (param !== null) {
		return connection.send(cmd.toUpperCase() + " " + param, null);		
	} else {
	  return connection.send(cmd.toUpperCase(), param);        
	}
    }
    catch (ex) {
		connection.connect(process.argv[2] || "192.168.1.137", 23, function() {
		  return process.stdout.write("connected to the receiver\r");
		});
		return connection.send(cmd.toUpperCase(), param);
	}
  }
});

connection.response(function(cmd, value) {
  var index, line, results;
  if (cmd === 'info') {
    results = [];
    for (index in value) {
      line = value[index];
      results.push(process.stdout.write("- " + (line) + "\n"));
    }
    return results;
  } else {
    return process.stdout.write("- " + cmd + ": " + value + "\n");
  }
});
