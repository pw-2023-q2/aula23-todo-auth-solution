import express, { RequestHandler } from "express";
import { engine } from "express-handlebars";
import * as path from "path"
import { Database, sessionStore } from "./models/database";
import { ItemController } from "./controllers/item-controller";
import { UserController } from "./controllers/user-controller";
import session from "express-session";
import { config } from "../conf/config";

/**
 * main route
 */
const app = express()

/**
 * home route
 */
app.get('/', (req, res) => {
    res.redirect('/items/newest')
})

/**
 * static route
 */
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

/**
 * template middleware
 */
app.engine('handlebars', engine({
    helpers: {
        formatDate: (date: string) => (date) ? date.substring(0,16) : '',
        fillDate: (dateStr: string) => (dateStr) ? Intl.DateTimeFormat("sv-SE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",

        }).format(new Date(Date.parse(dateStr))): '',
        equals: (a: string, b: string) => a == b
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '..', 'views'));

/**
 * session middleware
 */
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: 'auto'},
    store: sessionStore
}))

declare module 'express-session' {
    interface SessionData {
        authenticated: boolean,
        email: string
    }
}

/**
 * authentication utilities
 */
app.use((req, res, next) => {
    res.locals.authenticated = (req.session.authenticated) ? true : false
    res.locals.email = (req.session.email) ? req.session.email : 'unknown'
    next()
})

const authenticate: RequestHandler = (req, res, next) => {
    if (req.session.authenticated) {
        next()
    } else {
        res.redirect("/signin")
    }
}

/**
 * dependencies
 */
const database = new Database()
const itemController = new ItemController(database)
const userController = new UserController(database)

/**
 * items route
 */
const items = express.Router()

app.use('/items', authenticate, items)
items.get('/newest', itemController.newest)
items.get('/oldest', itemController.oldest)
items.get('/tags', itemController.tags)
items.get('/add', itemController.addForm)
items.post('/add', express.urlencoded({extended: true}), itemController.addProcess)
items.get('/edit/:id', itemController.editForm)
items.post('/edit', express.urlencoded({extended: true}), itemController.editProcess)
items.post('/remove/:id', itemController.remove)

/**
 * auth routes
 */
const users = express.Router()

app.get('/signup', userController.signupForm)
app.post('/signup', express.urlencoded({extended: true}), userController.signupProcess)
app.get('/signin', userController.signinForm)
app.post('/signin', express.urlencoded({extended: true}), userController.signinProcess)
app.get('/signoff', userController.signoff)

/**
 * Error route
 */
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err)    
    res.status(500).render('status', {
        code: 'exception'
    })
})

/**
 * Server startup
 */
const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server started at port ${port}`)
})