import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const admin2 = { username: "admin2", name: "admin2", surname: "admin2", password: "admin2", role: "Admin" }
const adminWithIncorrectPassword = { username: "admin", name: "admin", surname: "admin", password: "adminWrong", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let customerCookie2: string
let adminCookie2: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}
//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await postUser(admin)
    adminCookie = await login(admin)
    
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})


//A 'describe' block is a way to group tests. It can be used to group tests that are related to the same functionality
//In this example, tests are for the user routes
//Inner 'describe' blocks define tests for each route
describe("User routes integration tests", () => {

    describe("POST /users", () => {
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and create a new user", async () => {
            //A 'request' function is used to send a request to the server. It is similar to the 'fetch' function in the browser
            //It executes an API call to the specified route, similarly to how the client does it
            //It is an actual call, with no mocking, so it tests the real behavior of the server
            //Route calls are asynchronous operations, so we need to use 'await' to wait for the response
            await request(app)
                .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(customer) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                .expect(200) //The 'expect' block is used to check the response status code. We expect a 200 status code for a successful operation

            //After the request is sent, we can add additional checks to verify the operation, since we need to be sure that the user is present in the database
            //A possible way is retrieving all users and looking for the user we just created.
            const users = await request(app) //It is possible to assign the response to a variable and use it later. 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
                .expect(200)
            expect(users.body).toHaveLength(2) //Since we know that the database was empty at the beginning of our tests and we created two users (an Admin before starting and a Customer in this test), the array should contain only two users
            let cust = users.body.find((user: any) => user.username === customer.username) //We look for the user we created in the array of users
            expect(cust).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
        })
        //test the error for login if the password is wrong
        test("It should return a 401 error code if the password is wrong", async () => {
            await request(app)
            .post(`${routePath}/sessions`)
            .send(adminWithIncorrectPassword)
            .expect(401);
        })
        //it should return error 401 at login if the user doesn't exist
        test("It should return a 401 error code if the user does not exist", async () => {
            await request(app)
                .post(`${routePath}/sessions`)
                .send({ username: "UnexistingUser", password: "test" })
                .expect(401)
        })
        //Tests for error conditions can be added in separate 'test' blocks.
        //We can group together tests for the same condition, no need to create a test for each body parameter, for example
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .post(`${routePath}/users`)
                .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" }) //We send a request with an empty username. The express-validator checks will catch this and return a 422 error code
                .expect(422)
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" }).expect(422) 
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "", password: "test", role: "Customer" }).expect(422)
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "test", password: "", role: "Customer" }).expect(422)
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "test", password: "test", role: "" }).expect(422)
        })
        //It should return a 409 error when the username is a username that already exists in the database
        test("It should return a 409 error code if the username already exists in the database", async () => {
            await request(app).post(`${routePath}/users`).send(customer).expect(409); //this user is already in the database, we expect an error (409)
        });
    })
    describe("POST /ezelectronics/sessions/logout", () => {
        test("It should return a 200 success code", async () => {
            await request(app).delete(`${routePath}/sessions/current`).set("Cookie", adminCookie).expect(200)
        })
        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app).delete(`${routePath}/sessions/current`).expect(401);
            adminCookie=await login(admin);
        })
        
    })
    //completely tested
    describe("GET /users", () => {
        test("It should return an array of users", async () => {
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(2)
            let cust = users.body.find((user: any) => user.username === customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            let adm = users.body.find((user: any) => user.username === admin.username)
            expect(adm).toBeDefined()
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).get(`${routePath}/users`).expect(401) //We can also call the route without any cookie. The result should be the same
        })
    })

    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            //Route parameters are set in this way by placing directly the value in the path
            //It is not possible to send an empty value for the role (/users/roles/ will not be recognized as an existing route, it will return 404)
            //Empty route parameters cannot be tested in this way, but there should be a validation block for them in the route
            const admins = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", adminCookie).expect(200)
            expect(admins.body).toHaveLength(1) //In this case, we expect only one Admin user to be returned
            let adm = admins.body[0]
            expect(adm.username).toBe(admin.username)
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
        })
        test("It should fail if the role is not valid", async () => {
            //Invalid route parameters can be sent and tested in this way. The 'expect' block should contain the corresponding code
            await request(app).get(`${routePath}/users/roles/Invalid`).set("Cookie", adminCookie).expect(422)
        })
        test("It should return an error 401 if the user is not an admin", async () => {
             await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", customerCookie).expect(401)
        })
    })
    describe("GET /users/roles/:username", () => {
        //First test: error 422 if the username string is empty-> it cannot be tested
        //Second test: error 404 if the username does not exist in the database
        //Third test: return the user if the username exists in the database and it's the user itself asking for it
        //Fourth test: return the user if the username exists in the database and the user is an admin (different from the required one)
        //Fifth test: return 401 error if the user is not an admin and the username is different from the user itself
        test("It should return an error 404 if the user does not exist in the db", async () => {
            await request(app).get(`${routePath}/users/UnexistingUser`).set("Cookie", adminCookie).expect(404)
        })
        test("It should return the user if the user is the same as the requested one", async () => {
            const user = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", customerCookie).expect(200)
            expect(user.body.username).toBe(customer.username)
            expect(user.body.name).toBe(customer.name)
            expect(user.body.surname).toBe(customer.surname)
            expect(user.body.role).toBe(customer.role)
        })
        test("It should return the user if the user requesting it is an admin", async () => {
            const user = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", adminCookie).expect(200)
            expect(user.body.username).toBe(customer.username)
            expect(user.body.name).toBe(customer.name)
            expect(user.body.surname).toBe(customer.surname)
            expect(user.body.role).toBe(customer.role)
        })
        test("It should return 401 error if the user is not an admin and it requires info about another user", async () => {
            const user = await request(app).get(`${routePath}/users/${admin.username}`).set("Cookie", customerCookie).expect(401)
        })
    })
    describe("DELETE ezelectronics/users/:username", () => {
        //First test: error 422 if the username string is empty->it cannot be tested
        //Second test: error 404 if the username does not exist in the database
        //Third error: error 401 if the username not equal to the user calling the route, and the user calling the route is not an admin
        //Fourth error: the calling user is an admin who's trying to delete another admin user (error 401)
        test("It should return an error 404 if the user does not exist in the db", async () => {
            await request(app).delete(`${routePath}/users/UnexistingUser`).set("Cookie", adminCookie).expect(404)
        })
        test("It should return an error 401 if the user is trying to delete another user and it's not an admin", async () => {
            await postUser(admin2) //adding an admin and a customer for the purpose of these tests
            await postUser(customer2)
            adminCookie2 = await login(admin2);
            await request(app).delete(`${routePath}/users/${customer2.username}`).set("Cookie", customerCookie).expect(401)
        })
        test("It should return an error 401 if the user is trying to delete another admin", async () => {
            await request(app).delete(`${routePath}/users/${admin2.username}`).set("Cookie", adminCookie).expect(401)
        })
        //Now correct executions missing
        //Customer2 deletes himself and we expect to have 3 elements in the db rn 
        //Reinsert Customer2, Admin tries to delete him and we have 3 elements in the db rn 
        //Admin2 deletes himself, we have 2 elements in the db rn 
        test("Customer2 deletes himself", async () => {
            customerCookie2 = await login(customer2);
            const response = await request(app).delete(`${routePath}/users/${customer2.username}`).set("Cookie", customerCookie2).expect(200)
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(3) 
        })
        test("Admin2 deletes Customer2 which has been reinserted", async () => {
            await postUser(customer2); //reinsertion of customer2
            const response = await request(app).delete(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie2).expect(200)
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(3) 
        })
        test("Admin2 deletes himself", async () => {
            const response = await request(app).delete(`${routePath}/users/${admin2.username}`).set("Cookie", adminCookie2).expect(200)
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(2) 
        })
    })
    describe("DELETE ezelectronics/users", () => {
        //First test: error 401, the user calling the route is not an admin
        //Second test: admin call it, the database contains 1 elements
        //Third test: admin2 reinserted, adim call it and 2 elements left in the db 
        test("It should return an error 401 if the user calling the route is not an admin", async () => {
            await request(app).delete(`${routePath}/users`).set("Cookie", customerCookie).expect(401)
        })
        test("Admin deletes all non admin users, the db now have 1 element which is the admin itself", async () => {
            const response = await request(app).delete(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(1)
            let cust = users.body.find((user: any) => user.username === admin.username) //We look for the user we created in the array of users
            expect(cust).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(cust.name).toEqual(admin.name);
            expect(cust.surname).toEqual(admin.surname);
        })
        test("Admin deletes all non admin users", async () => {
            await postUser(admin2);
            const response = await request(app).delete(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(2) 
        })

        
    })

    describe("PATCH ezelectronics/users/:username", () => {
        //First test: error 422 if username is an empty string->We cannot test it
        //Substitution of the first test: try to pass an integer in the route
        //Second test: name,surname,birthdate not empty, date not empty and in the correct format->done
        //Third test: user not logged in tries to call it, 401 error->done
        //Fourth test: 404 error if the username does not exist in the db -> done
        //Fifth test: 400 error if birthdate is after the current date->done
        //Sixth test: 401 error when username is not equal to the username of the logged user calling the route, and the user calling the route is not an Admin->done
        //Seventh test: A user updates himself
        //Eight test: An admin updates a user
        //Do I have to test also the case in which the username is not the same?????
        test("It should return an error 404 if the user does not exist in the db", async () => {
            //I reintroduce the four users in the db (they have been previously deleted)
            await postUser(customer2)
            await postUser(customer)
            customerCookie2 = await login(customer2);
            customerCookie = await login(customer);
            adminCookie2 = await login(admin2);
            await request(app).patch(`${routePath}/users/UnexistingUser`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "2020-01-01" }).expect(404)
        })
        test("It should return an error 401 if the user is trying to update another user and it's not an admin", async () => {
            await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", customerCookie).send({ name: "test", surname: "test", address: "test", birthdate: "2021-01-01" }).expect(401)
        })
        test("It should return an error 400 if the birthdate is after the current date or 422 if not in the correct format", async () => {
            await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "2025-01-01" }).expect(400)
            await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "01-01-2000" }).expect(422)
            await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "" }).expect(422)
        })
        test("It should return an error 422 if body parameters are empty or they're not a string", async () => {
            await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).send({ name: "", surname: "test", address: "test", birthdate: "2020-10-01" }).expect(422)
            await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).send({ name: "test", surname: "", address: "test", birthdate: "2020-10-01" }).expect(422)
            await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "", birthdate: "2020-10-01" }).expect(422)
        })
        test("It should return an error 401 if the user calling it didn't perform login", async () => {
            await request(app).patch(`${routePath}/users/${customer2.username}`).send({ name: "test", surname: "test", address: "test", birthdate: "2021-01-01" }).expect(401)
        })
        //user updates himself
        test("User updates himself", async () => {
            const response = await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", customerCookie2).send({ name: "test", surname: "test", address: "test", birthdate: "2021-01-01" }).expect(200)
            const user = await request(app).get(`${routePath}/users/${customer2.username}`).set("Cookie", customerCookie2).expect(200)
            expect(user.body.name).toBe("test")
            expect(user.body.surname).toBe("test")
            expect(user.body.address).toBe("test")
            expect(user.body.birthdate).toBe("2021-01-01")
        })
        //admin updates a user
        test("Admin updates a user", async () => {
            const response = await request(app).patch(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).send({ name: "test2", surname: "test2", address: "test2", birthdate: "2021-01-01" }).expect(200)
            const user = await request(app).get(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).expect(200)
            expect(user.body.name).toBe("test2")
            expect(user.body.surname).toBe("test2")
            expect(user.body.address).toBe("test2")
            expect(user.body.birthdate).toBe("2021-01-01")
        })


        
    })

})
