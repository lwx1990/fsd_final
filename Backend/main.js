require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mysql = require('mysql2/promise')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const {MongoClient}= require('mongodb')
const {Telegraf} = require('telegraf')
const {MenuTemplate, MenuMiddleware} = require('telegraf-inline-menu')
const fetch = require('node-fetch')
const withQuery = require('with-query').default
const nodemailer = require("nodemailer");

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const MONGO_USER = process.env.MONGO_USER
const MONGO_PASSWORD = process.env.MONGO_PASSWORD
// const MONGO_URL = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster0.pd0u1.mongodb.net/?retryWrites=true&w=majority`

const MONGO_DB = 'sm2020'
const MONGO_COLLECTION = 'info'

const client = new MongoClient(MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true})

const pool = mysql.createPool({
    host: process.env.MYSQL_SERVER, 
    port: process.env.MYSQL_SVR_PORT, 
    database: process.env.MYSQL_SCHEMA,
    user: process.env.MYSQL_USERNAME , 
    password: process.env.MYSQL_PASSWORD ,
    connectionLimit: process.env.MYSQL_CON_LIMIT,
    timezone: '+08:00'
})

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD

const TOKEN_SECRET = process.env.TOKEN_SECRET

const SQL_SELECT_USER = `select user_id from user where user_id = ? and password = sha1(?)`

const SQL_INSERT_USER = `INSERT INTO user(user_id, password, firstname, lastname, email) values (?,sha1(?),?,?,?)`

const SQL_GET_USER = `select firstname, lastname , email from user where user_id = ?`


const makeAuth = (passport)=>{
    return (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if ((null != err) || (!user.username)) {
                res.status(401)
                res.json({error: err})
                return
            }
            req.user = user
            next()
        })(req, res, next)
    }
}

passport.use(new LocalStrategy(
    {   
        usernameField: 'username',
        passwordField: 'password'

    },
    async (user, password, done)=> {
        //perform authentication
        console.info(`localstrategy>> username: ${user}, password: ${password}`)

        const conn = await pool.getConnection()

        try{
            const [ result, _ ] = await conn.query(SQL_SELECT_USER, [user, password])

            console.log(result)

            if(result.length > 0){
                done(null, {
                    username: result[0].user_id,
                    loginTime: (new Date()).toString(),
                    
                })
            }else{
                done('Incorrect username or password', false)
            }  
        } catch(e){
            done(e,false)
        } finally{
            conn.release()
        }
    }

))

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
// const PORT = parseInt(process.env.PORT)

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(morgan('combined'))
app.use(cors())
app.use(express.static(__dirname + '/frontend'))

const localStrategyAuth = makeAuth(passport)

const insertUser = async (username, password, firstname, lastname, email) => {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        //console.log(conn)
        console.log(username)
        console.log(password)

        let result = await conn.query(SQL_INSERT_USER, [username, password,firstname,lastname,email])
        console.log(result)

        await conn.commit()

    } catch(e){
        console.log(e);
        conn.rollback()
        
    } finally {
        conn.release()
    }
}


//initialize passport after json and form url-encoded
app.use(passport.initialize())

app.post('/register', (req, res)=>{

    let {firstname , lastname, username , email, password} = req.body

    console.log(req.body)

    insertUser(username, password, firstname,lastname,email)

    const transporter = nodemailer.createTransport({
        service: "Gmail", 
        auth: {
          user: 'randomfood12345@gmail.com', 
          pass: process.env.EMAIL_PASSWORD, 
        },
    });

    const message  = {
        from: 'randomfood12345@gmail.com', // sender address
        to: email, // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Thank you for registering", // plain text body
       
    };

    transporter.sendMail(message, function(err, info) {
	    if (err) {
	      console.log(err)
	    } else {
	      console.log('mail has sent.');
	      console.log(info);
	    }
	});

    res.status(200)
    res.json({message: "ok"})

   
})

app.post('/login', 
    //passport middleware to perform login
    // passport.authenticate('local', {session: false}),
    //authentication with custom error handling
    localStrategyAuth,   
    (req, res) =>{

        //do something
        console.info(`user: `, req.user)
        //generate JWT token
        const timeStamp = (new Date()).getTime() / 1000
        const token = jwt.sign({
            sub: req.user.username,
            iss: 'myApp',
            iat: (new Date()).getTime() / 1000,
            exp: timeStamp + 45,
            data: {
                loginTime: (new Date()).toString()
            }
            
        }, TOKEN_SECRET)

        res.status(200)
        res.type('application/json').json({message: `Login in at ${new Date()}`, token})
    }
)

app.get('/location', (req, res)=>{

    res.status(200)
    res.type('application/json').json({user_locations})

})

app.get('/consumer', (req, res)=>{

    res.status(200)
    res.type('application/json').json(consumer)
    
})

app.get('/user/:user_id', async (req, res)=>{
    const user_id = req.params.user_id
    
    res.type('application/json')

    const conn = await pool.getConnection()

    try {
        let result = await conn.query(SQL_GET_USER,[user_id])

        console.log(result)
        res.status(200)
        res.type('application/json').json({result})
    }catch(e){
        console.log(e);
        conn.rollback()
        
    } finally {
        conn.release()
    }
})


// <---Telegram bot--->
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN

const FOOD_URL = 'https://www.themealdb.com/api/json/v1/1/filter.php'

const product = []

const user_locations = {}

const consumer = []


function createInvoice (product) {
    return {
        provider_token: PAYMENT_TOKEN,
        start_parameter: 'foo',
        title: product.strMeal,
        description: product.strMeal,
        currency: 'SGD',
        photo_url: product.strMealThumb,
        is_flexible: false,
        need_shipping_address: false,
        prices: [{ label: product.strMeal, amount: Math.trunc(product.price * 100) }],
        payload: {}
    }
}

//create a menu
const menu = new MenuTemplate(()=> 'Food Categories')

//add buttons to the menu
menu.interact('beef', 'beef', {
    do: ctx => ctx.answerCbQuery('beef').then(()=> true),
})

menu.interact('chicken', 'chicken', {
    do: ctx => ctx.answerCbQuery('chicken').then(()=> true),
    joinLastRow: true
})
menu.interact('seafood', 'seafood', {
    do: ctx => ctx.answerCbQuery('seafood').then(()=> true),
    joinLastRow: true
})
menu.interact('dessert', 'dessert', {
    do: ctx => ctx.answerCbQuery('dessert').then(()=> true),
    joinLastRow: true
})

//menu middleware
const menuMiddleware = new MenuMiddleware('/', menu)


const fetchFood = async (cuisines, ctx) => {

   const url = withQuery(
        FOOD_URL,
        {
            c: cuisines        
        }
    )

    const result = await fetch(url)
    const food = await result.json()
     
    console.info('food: ', food)

    const foodChosed = food["meals"][Math.floor(Math.random()*10)]
    foodChosed.price = '7'
    
    product.unshift(foodChosed)

    console.log('>>product', product)

    ctx.replyWithPhoto(foodChosed['strMealThumb'], {caption: `${foodChosed['strMeal']}, price: $${foodChosed.price}` })
 
}

//when a user starts a session with your bot
bot.start( ctx => 
    ctx.reply('Hello! Welcome to my random food ordering bot. type /help for instructions')
)

bot.help(ctx => {
    ctx.reply("This bot can perform the following commands\n - /start\n - /categories: To choose food categories\n - type 'pay' to for payment\n - After payment please send current location")
})


bot.command('categories', (ctx)=>{
    //display menu if no country is selected
    console.info('ctx: ', ctx)
    console.info('ctx: ', ctx.message)
    const length = ctx.message.entities[0].length
    const cuisines = ctx.message.text.substring(length).trim()

    if (cuisines.length <= 0){
        return menuMiddleware.replyToContext(ctx)
    }
})


bot.on('location', async ({from, message}) => {
	const user = from.id;
	let location = message.location;
    console.log(from, user, location);
    bot.telegram.sendMessage(message.chat.id, "We will deliver your order to " + [message.location.longitude,message.location.latitude].join(";"))

    user_locations.lat = location.latitude
    user_locations.lng = location.longitude


    console.log(user_locations)

    const obj = {
        userId: from.id,
        first_name: from.first_name,
        location: location,
        food: product[0].strMeal,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    }

    consumer.unshift(obj)

    console.log('consumer>> ', consumer)

    try{
        await client.db(MONGO_DB).collection(MONGO_COLLECTION)
                                    .insertOne(obj)
    }catch(e){
        console.log(e)
    }

    
})

bot.use((ctx, next)=>{
    if (ctx.callbackQuery != null) {
        const cuisines = ctx.callbackQuery.data.substring(1).trim()
        console.log('menu', cuisines)
        console.log('callbackquery: ', ctx.callbackQuery)
        
        return fetchFood(cuisines, ctx)
        
    } 
    next()
})


bot.hears('pay', (ctx)=>{
    ctx.replyWithInvoice(createInvoice(product[0]))
})

// Handle payment callbacks
bot.on('pre_checkout_query', ({ answerPreCheckoutQuery }) => answerPreCheckoutQuery(true))
bot.on('successful_payment', (ctx) => {
    console.log(`${ctx.from.first_name} just payed ${ctx.message.successful_payment.total_amount / 100} $.`)
    bot.telegram.sendMessage(ctx.message.chat.id, "Please send your location")
    
})


bot.startPolling();

//start the bot
console.info(`start bot at ${new Date()}`)
bot.launch()
// <---Telegram bot--->



const p0 = (async ()=> {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    return true

})()

const p1 = (async ()=> {
    await client.connect()
    return true
})()

Promise.all([[p0, p1]])
 .then((r)=> {
	 app.listen(PORT, ()=>{
		 console.info(`Application started on port ${PORT} at ${new Date()}`) 
	 })
 })

