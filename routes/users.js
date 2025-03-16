const mongoose = require('mongoose');
const { use } = require('passport');
const plm = require('passport-local-mongoose');

// mongoose.connect('mongodb://127.0.0.1:27017/vision');

const userSchema = mongoose.Schema({
  username: String,
  fullname: String,
  email: String,
  password: String,
  profileImage: String,
  birthdate: Date,
  boards: {
    type: Array,
    default: []
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ]
});


userSchema.plugin(plm);

module.exports = mongoose.model('User', userSchema);