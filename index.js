var http = require('http');
const https = require('https');
var querystring = require('querystring');
var express = require('express');
var app = express();

app.get('/user/:username', function(req, res){
	var u = req.params.username;
	if (users[u])
		res.send(200, users[u].status );
	else
		res.send(200, '0');
});
app.get('/all', function(req, res){
	res.send(200, users);
});


get('ci.docapost.io', 443, '/jenkins/api/json?pretty=true', success);
setInterval(function() {
	get('ci.docapost.io', 443, '/jenkins/api/json?pretty=true', success);
}, 30000);

app.listen(3000);

var unwanted = ['POSC-TF', 'POSC-Hub-Datastore-Sonar', 'Test Landing page'];
var users = {};

function success(data) {
	var date = new Date().getTime();
	data.jobs.filter((j) => {
		return true;//j.color != 'blue';
	}).map((j) => {
		var i = j.url.indexOf('/jenkins');
		get('ci.docapost.io', 443, j.url.substring(i, j.url.length) + '/api/json', (d) => {
			var b = d.builds[0];
			if (b) {
				get('ci.docapost.io', 443, b.url.substring(i, b.url.length) + '/api/json', (d) => {
					if (unwanted.filter((u) => { return d.fullDisplayName.indexOf(u) >= 0; }).length == 0 && d.fullDisplayName.indexOf('-V1.') < 0) {
						console.log(d.result + ' - ' + d.fullDisplayName);
						console.log(d.culprits);
						var status = 0;
						if (d.result == 'FAILURE')
							status = 1;
						if (d.building)
							status = 2;
						d.culprits.map((u) => { 
							var username = u.absoluteUrl.substring(u.absoluteUrl.lastIndexOf('/') + 1, u.absoluteUrl.length);
							updateUser(username, date, status);
						});
					}
				});
			}
		});
	});
}
// status : 0: success, 1: failure, 2: building
function updateUser(login, date, status) {
	var u = users[login];
	if (u) {
		if (date == u.date) {
			if (status > u.status)
				u.status = status;
		} else {//date > u.date
			u.status = status;
		}
		u.date = date;
	} else {
		users[login] = {login:login, date:date, status:status};
	}
}

function get(url, port, path, success, error) {
	var options = {
		hostname: url,
		port: port,
		path: path,
		method: 'GET',
		auth:''//TODO : put clear login:password
	};

	var req = https.request(options, (res) => {
		var data = '';
		res.setEncoding('utf8');
	    res.on('data', function(chunk) {
		    data += chunk;
		}).on('end', function() {
			success && success(JSON.parse(data));
		});
	});
	req.end();
	req.on('error', (e) => {
		error && error(e);
	});
}

/*
function headersCallback(headers) {
	console.log(headers['set-cookie'][0]);
	
	get(
		'ci.docapost.io', 
		443, 
		'jenkins/api/json?pretty=true',
		{'Cookie':headers['set-cookie'][0], 'Accept':'application/json'},
		success);
}

function post(url, port, path, data, headersCallback, success, error) {
	var postData = querystring.stringify(data);

	var options = {
	  hostname: url,
	  port: port,
	  path: path,
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/x-www-form-urlencoded',
	    'Content-Length': postData.length
	  }
	};

	var req = https.request(options, (res) => {
		headersCallback && headersCallback(res.headers);
		
		res.on('data', (chunk) => {
			success && success(chunk);
		});
	});
	
	req.on('error', (e) => {
	  error && error(e);
	});

	// write data to request body
	req.write(postData);
	req.end();
}*/