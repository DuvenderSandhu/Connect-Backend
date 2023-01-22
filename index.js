const express= require('express')
const bcrypt= require('bcryptjs')
const jwt= require('jsonwebtoken')
const JWT_SECRET = "Connect_@DSANDHU";
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const connectToMongo=async function(){
try{
  let result=await mongoose.connect('mongodb://127.0.0.1:27017/Connect');
  return "connected"
}
catch{
  return {alert:"Internal Server Error"}
}
}
const UserSchema=new mongoose.Schema({
  username:String,
  email:String,
  password:String,
  info:Object
})
const User = mongoose.model('Users', UserSchema)


const app= express()
app.use(express.json())
app.get('/',(req,res)=>{
  res.send("Welcome")
})

app.get('/search',async (req,res)=>{
if(req.body.token){
  if(req.body.query){
    let result=connectToMongo()
    if(result.alert){
      res.json(result)
    }
    else{
      let searched=await User.find({username:req.body.query})
      res.json(searched)
    }
  }
  else{
    res.send("Search Here")
  }
}
else{
  res.redirect('/login')
}
})

app.post('/request',async (req,res)=>{
  let user=jwt.decode(req.body.token)
  let result=connectToMongo()
  let requested_user=await User.find({username:req.body.query}).select(['-password','-email'])
  if(user.username!=requested_user[0].username && requested_user[0].info.req.indexOf(user.username)<0 ){
    requested_user[0].info.req.push(user.username)
    let response=await User.updateOne({username:requested_user[0].username},{
      $set:{
        "info": {
          "req_no": requested_user[0].info.req_no+1,
          "friends_no": 0,
          "req": requested_user[0].info.req,
          "friends": []
        },
      }
    })
  let new_user=await User.find({username:req.body.query}).select(['-password','-email'])

res.json({response:typeof(requested_user[0].info.req),new_user})
  }
  else{
    res.send(requested_user)
  }
})



app.get("/signup", async (req, res) => {
 res.send("SIgnup Get")

});
app.get("/login", (req, res) => {

    res.json({requirement:"Login GET"});
});

app.post("/signup", async (req, res) => {
  let result= await connectToMongo()
  if(result.alert){
    res.send(result)
  }
  else{
    let users=await User.find({
      $or: [{ email: req.body.email.toLowerCase() }, { username: req.body.username.toLowerCase() }]
    })
    if(users.length!=0){
      res.json({alert:"User Already Exist with same Details"})
    }
    else{
      let user=await User.create({username:req.body.username,email:req.body.email,password:await bcrypt.hash(req.body.password,await bcrypt.genSalt(10)),info:{req_no:0,friends_no:0,req:[],friends:[]}})
      res.send(user)
    }
  
  }
});

app.post("/login", async (req, res) => {
  let result= await connectToMongo()
  if(result.alert){
    res.send(result)
  }
  else{
    let users=await User.find({
      $or: [{ username: req.body.username.toLowerCase() }]
    })
    if(users.length!=0){
      if(await bcrypt.compare(req.body.password,users[0].password)){
        let payload={
          username:users[0].username,
          email:users[0].email
        }
        let token=jwt.sign(payload,JWT_SECRET)
        res.json({token:token})
      }
      else{
        res.json({alert:"Invalid Credentials"})
      }
    }
    else{
      res.json({alert:"Invalid Credentials"})
    }
  
  }
});

app.listen(80,()=>{
    console.log(`http://localhost`)
})