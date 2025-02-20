if(process.env.NODE_ENV != "production"){
    require('dotenv').config()
}

const express = require("express");
const app = express(); 
const path = require("path");
const methodOverride = require("method-override"); 
const ejsMate = require("ejs-mate");

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require('./routes/user.js');

app.engine('ejs',ejsMate);
app.use(methodOverride('_Method'));

app.set('view engine','ejs');
app.set('views',path.join(__dirname,"/views"));


app.use(express.static(path.join(__dirname,"/public")));

app.use(express.urlencoded({extended:true}));


const sessionOPtions = {
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true
    }
};

app.use(session(sessionOPtions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req , res , next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash('error');
    res.locals.user = req.user;
    next();
});


//---------->>> Connecting DB
const mongoose = require('mongoose');

async function Main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}
Main().then(() => {
    console.log("Connection Successfull");
})
.catch((err) => {
    console.log(err);
})

app.listen(8080 , () => {
    console.log(`Listening from post ${8080}`);
})


//--------->>> Routes

app.use('/listings',listingsRouter);
app.use('/listings/:id/reviews', reviewsRouter );
app.use('/',userRouter);


//---------------->>> error handler
app.all("*",(req, res , next) => {
    res.status(404).render('listings/pageNot.ejs');
});

app.use((err,req,res,next) => {
    let {statusCode = 500 , message = " Some Error Occured"} = err;
    res.status(statusCode).render("error.ejs",{message});
});