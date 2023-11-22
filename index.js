const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

const mySecret = process.env.DB_URL; // Ensure your MongoDB URL is stored in the environment variable DB_URL

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const UserSchema = new Schema({
  username: String
});
const User = mongoose.model('User', UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Creating a new user
app.get('/api/users', async(req, res)=>{
  const users = await User.find({}).select("_id username")
  if(!users){
    res.send("No Users")
  } else {
    res.json(users)
  }
});






app.post('/api/users', async (req, res) => {
  console.log(req.body)
  const userObj = ({
    username: req.body.username
  })
  try {
    const user = await new User(userObj).save();
    console.log(user);
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

// Creating a new exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  try {
    const user = await User.findById(id)
    if (!user) {
      res.send('user does not exist')
    } else {
      const exerciseObj = ({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });
      const exercise = await new Exercise(exerciseObj).save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch (err) {
    console.log(err)
    res.send("there is and error")
  }
});



app.get("/api/users/:_id/logs", async (req, res)=>{
  const { from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    res.send("Could not find user")
    return;
  }
  let dateObj = {};
  if(from){
    dateObj["$gte"] = new Date(from)
  }
  if(to){
    dateObj["$lte"] = new Date(to)
  }
  let filter ={
    user_id: id
  }
  if( to || from ){
    filter.date = dateObj
  }
  const exercise = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercise.map( e =>({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))

  
  res.json({
    username: user.username,
    count: exercise.length,
    _id: user._id,
    log
  })
});

const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
});
