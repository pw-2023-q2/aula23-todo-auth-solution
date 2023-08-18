import { RequestHandler } from "express";
import { Database } from "../models/database";
import { User, UserDAO } from "../models/user-model";
import { compare, hash } from "bcrypt";
import session from "express-session";

export class UserController {
    private dao: UserDAO

    constructor(database: Database) {
        this.dao = new UserDAO(database)
    }

    signinForm: RequestHandler = (req, res) => {
        res.render('signin')
    }

    signinProcess: RequestHandler = async (req, res, next) => {
        try {
            const userInput = UserMapper.fromJson(req.body)
            const user = await this.dao.findByEmail(userInput.email)

            if (user && await compare(userInput.password, user.password)) {
                req.session.authenticated = true
                req.session.email = user.email
                res.redirect('/')
            } else {
                throw new Error('User or password is wrong')
            }            
        } catch(error) {
            console.log(error)
            res.render('status', {code: 'signin_failed'})
        }
    }

    signupForm: RequestHandler = (req, res) => {
        res.render('signup')
    }

    signupProcess: RequestHandler = async (req, res, next) => {
        try {
            if (UserMapper.matchPassword(req.body)) {
                const user = UserMapper.fromJson(req.body)

                user.password = await hash(user.password, 10)
                if(await this.dao.insert(user)) {
                    res.render('status', {
                        code: 'signup_success'
                    })
                }
            } else {
                res.render('status', {
                    code: 'passwords_dont_match'
                })
            }
        } catch(error) {
            next(error)
        }
    }

    signoff: RequestHandler = (req, res, next) => {
        req.session.authenticated = false
        req.session.email = ''
        res.redirect('/')
    }
}

class UserMapper {
    static fromJson(json: any): User {
        if ('email' in json && 'password' in json) {
            const user = {
                email: json.email,
                password: json.password
            } as User

            if ('id' in json) {
                user.id = json.id
            } 

            return user
        }
        throw new Error('User fields out of expected structure')
    }

    static matchPassword(json: any): boolean {
        console.log(json)
        if ('password' in json && 'password-confirm' in json) {
            return json.password == json['password-confirm']
        }

        return false;
    }
}