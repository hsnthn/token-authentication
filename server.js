var express 	= require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); 
var config = require('./config'); 
var User   = require('./app/models/user'); 

var port = process.env.PORT || 8080;
mongoose.connect(config.database); 
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

// create manuel user
app.get('/setup', function(req, res) {

	var nick = new User({ 
		name: 'Hasan Tahan', 
		password: 'elpsycongroo'
	});
	nick.save(function(err) {
		if (err) throw err;

		console.log('User saved successfully');
		res.json({ success: true });
	});
        var second_nick = new User({
                name: 'Mehmet Ali Gozaydin',
                password: 'elpsycongroo'
        });
        second_nick.save(function(err) {
                if (err) throw err;

                console.log('User saved successfully');
                res.json({ success: true });
        });

});

app.get('/', function(req, res) {
	res.send('The API is  http://localhost:' + port + '/api');
});

var apiRoutes = express.Router(); 

apiRoutes.post('/authenticate', function(req, res) {

	User.findOne({
		name: req.body.name
	}, function(err, user) {

		if (err) throw err;

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {

			if (user.password != req.body.password) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

				// if user is found and password is right
				// create a token
				var token = jwt.sign(user, app.get('superSecret'), {
					expiresIn: 86400 // expires in 24 hours
				});

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
			}		

		}

	});
});

apiRoutes.use(function(req, res, next) {

	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	if (token) {

		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});
		
	}
	
});

apiRoutes.get('/', function(req, res) {
	res.json({ message: 'Welcome' });
});

apiRoutes.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});

apiRoutes.get('/check', function(req, res) {
	res.json(req.decoded);
});

app.use('/api', apiRoutes);

app.listen(port);
