var express = require('express');
var router = express.Router();
const userModel = require('../routes/users');
const postModel = require('../routes/post');
const { use } = require('passport');
const passport = require('passport');
const upload = require('../routes/multer');

const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {nav: false});
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      return next(err); 
    }
    
    if (!user) {
      req.flash('error', 'Invalid username or password');
       return res.redirect('/login');
    }
    
    req.logIn(user, function(err) {
      if (err) { 
        return next(err); 
      }
      req.flash('success', 'Welcome back!');
      return res.redirect('/profile');
    });
  })(req, res, next);
});

router.get('/login', function(req, res, next) {
  res.render('login', {error: req.flash('error'), nav: false});
});

router.get('/register', function(req, res, next) {
  res.render('register', { step: 1, nav: false});
});

router.post('/register/step1', function(req, res, next) {
  if (!req.session) {
    req.session = {};
  }
  req.session.registerData = {
    email: req.body.email,
    birthdate: req.body.birthdate,
    password: req.body.password
  };
  res.render('register', { nav: false, step: 2 });
});

router.post('/register/step2', async function(req, res, next) {
  try {
    if (!req.session.registerData) {
      req.flash('error', 'Registration data missing');
      return res.redirect('/register');
    }

    const data = new userModel({
      username: req.body.username,
      fullname: req.body.fullname,
      email: req.session.registerData.email,
      birthdate: req.session.registerData.birthdate
    });

    // Register the user
    const registeredUser = await userModel.register(data, req.session.registerData.password);
    
    // Login after registration
    req.login(registeredUser, function(err) {
      if (err) {
        console.error('Login error after registration:', err);
        req.flash('error', 'Registration successful but login failed');
        return res.redirect('/login');
      }
      
      delete req.session.registerData;
      req.flash('success', 'Welcome to Vision ' + data.username);
      res.redirect('/profile');
    });
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', err.message);
    res.redirect('/register');
  }
});

router.get('/profile', isLoggedIn, async function(req, res, next) { 
  
  const user = await userModel
                      .findOne({username: req.session.passport.user})
                      .populate("posts");
                      console.log(user.posts[0]?.image); // Check image field
                  
  res.render('profile', { user, nav: true });
});

router.get('/show/posts', isLoggedIn, async function(req, res, next) { 
  
  const user = await userModel
                      .findOne({username: req.session.passport.user})
                      .populate("posts");
                  
  res.render('show', { user, nav: true });
});

router.get('/feed', isLoggedIn, async function(req, res, next) { 
  
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find().populate('user')
                  
  res.render('feed', { user, posts, nav: true });
});

router.get('/post/:id', async function(req, res, next) {
  try {
      const post = await postModel.findById(req.params.id)
          .populate('user', 'username fullname profileImage');
      
      if (!post) {
          req.flash('error', 'Post not found');
          return res.redirect('/feed');
      }

      res.render('post', { 
          post: post,
          nav: true 
      });
  } catch (err) {
      console.error('Show post error:', err);
      req.flash('error', 'Error loading post');
      res.redirect('/feed');
  }
});

router.post('/fileupload', isLoggedIn, upload.single("image"),async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
});

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if(err) { return next(err);}
    res.redirect("/");
  });
});

router.get('/add', isLoggedIn, async function(req, res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('add', {user, nav: true});
});

router.post('/createpost', isLoggedIn, upload.single("postimage"), async function(req, res, next){
  const user = await userModel.findOne({username: req.session.passport.user});
  if (!user) {
    req.flash('error', 'User not found');
    return res.redirect('/add');
  }
  try {
    if (!req.file) {
      req.flash('error', 'Please select an image');
      return res.redirect('/add');
    }

    const post = await postModel.create({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    });

    // Add post to user's posts array
    user.posts.push(post._id);
    await user.save();
    
    req.flash('success', 'Post created successfully!');
    res.redirect('/profile');
  } catch (error) {
    console.log("Uploaded file:", req.file);
    console.error('Post creation error:', error.stack);  // Log full error details
    req.flash('error', 'Error creating post: ' + error.message);
    res.redirect('/add');
  }
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  req.flash('error', 'Please log in first');
  res.redirect("/login");
}

module.exports = router;
