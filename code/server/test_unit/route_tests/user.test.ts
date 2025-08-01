import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import {DateError} from "../../src/utilities"
import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import { UserAlreadyExistsError,UserNotFoundError,UnauthorizedUserError, UserNotAdminError } from "../../src/errors/userError"
const baseURL = "/ezelectronics"
import { Utility } from "../../src/utilities"
//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

//test of utilities.ts
describe("Utilities unit tests",()=>{
    test("It should return true if the user is a customer",async()=>{
        const response = Utility.isCustomer(testCustomer);
        expect(response).toBe(true);
    });
    test("It should return true if the user is an admin",async()=>{
        const response = Utility.isAdmin(testAdmin);
        expect(response).toBe(true);
    });
    //false if user is customer
    test("It should return false if the user is not a manager",async()=>{
        const response = Utility.isManager(testCustomer);
        expect(response).toBe(false);
    });



})


describe("Route unit tests", () => {
    describe("POST /users", () => {
        test("It should return a 200 success code", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: "Manager" };
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true);
    
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(200);
            expect(UserController.prototype.createUser).toHaveBeenCalled();
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role);
        });
    
        test("It should return a 422 error code if username is missing or invalid", async () => {
            const inputUser = { name: "test", surname: "test", password: "test", role: "Manager" };
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });
    
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(422);
        });
    
        test("It should return a 422 error code if name is missing or invalid", async () => {
            const inputUser = { username: "test", surname: "test", password: "test", role: "Manager" };
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });
    
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(422);
        });
    
        test("It should return a 422 error code if surname is missing or invalid", async () => {
            const inputUser = { username: "test", name: "test", password: "test", role: "Manager" };
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });
    
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(422);
        });
    
        test("It should return a 422 error code if password is missing or invalid", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", role: "Manager" };
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });
    
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(422);
        });
    
        test("It should return a 422 error code if role is missing or invalid", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: "InvalidRole" };
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });
    
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(422);
        });
    
        test("It should return a 409 error code if the username is already in use", async () => {
            const inputUser = { username: "existingUser", name: "test", surname: "test", password: "test", role: "Manager" };
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError());
    
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(409);
        });
        //We are testing a route that creates a user. This route calls the createUser method of the UserController, uses the express-validator 'body' method to validate the input parameters and the ErrorHandler to validate the request
        //All of these dependencies are mocked to test the route in isolation
        //For the success case, we expect that the dependencies all work correctly and the route returns a 200 success code
        test("It should return a 200 success code", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: "Manager" }
            //We mock the express-validator 'body' method to return a mock object with the methods we need to validate the input parameters
            //These methods all return an empty object, because we are not testing the validation logic here (we assume it works correctly)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            //We mock the UserController createUser method to return true, because we are not testing the UserController logic here (we assume it works correctly)
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true)

            /*We send a request to the route we are testing. We are in a situation where:
                - The input parameters are 'valid' (= the validation logic is mocked to be correct)
                - The user creation function is 'successful' (= the UserController logic is mocked to be correct)
              We expect the 'createUser' function to have been called with the input parameters and to return a 200 success code
              Since we mock the dependencies and we are testing the route in isolation, we do not need to check that the user has actually been created
            */
            const response = await request(app).post(baseURL + "/users").send(inputUser)
            expect(response.status).toBe(200)
            expect(UserController.prototype.createUser).toHaveBeenCalled()
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role)
        })
    })

    describe("GET /users", () => {
        test("It returns an array of users", async () => {
            //The route we are testing calls the getUsers method of the UserController and the isAdmin method of the Authenticator
            //We mock the 'getUsers' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])
            //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

            //We send a request to the route we are testing. We are in a situation where:
            //  - The user is an Admin (= the Authenticator logic is mocked to be correct)
            //  - The getUsers function returns an array of users (= the UserController logic is mocked to be correct)
            //We expect the 'getUsers' function to have been called, the route to return a 200 success code and the expected array
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsers).toHaveBeenCalled()
            expect(response.body).toEqual([testAdmin, testCustomer])
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
    
            const response = await request(app).get(baseURL + "/users");
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });
        test("It should fail if the user is not an Admin", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(401)
        })
    })

    describe("GET /users/roles/:role", () => {

        test("It returns an array of users with a specific role", async () => {
            //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
            //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testAdmin])
            //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
            //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
            const response = await request(app).get(baseURL + "/users/roles/Admin")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin")
            expect(response.body).toEqual([testAdmin])
        })

        test("It should fail if the role is not valid", async () => {
            //In this case we are testing a scenario where the role parameter is not among the three allowed ones
            //We need the 'isAdmin' method to return the next function, because the route checks if the user is an Admin before validating the role
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})
            //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));
            //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
            //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
            const response = await request(app).get(baseURL + "/users/roles/Invalid")
            expect(response.status).toBe(422)
        })
        test("It should call next with an error if the controller throws an error", async () => {
            const errorMessage = "Internal Server Error";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error(errorMessage));
    
            const nextMock = jest.fn();
    
            // Simuliamo la richiesta GET alla route
            await request(app).get(baseURL + "/users").expect(503);
        });
    })
    

    describe("GET /users/roles/:role", () => {
        test("It returns an array of users with a specific role", async () => {
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testAdmin]);
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            
            const response = await request(app).get(baseURL + "/users/roles/Admin");
            
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin");
            expect(response.body).toEqual([testAdmin]);
        });
    
        test("It should fail if the role is not valid", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            });
    
            const response = await request(app).get(baseURL + "/users/roles/Invalid");
    
            expect(response.status).toBe(422);
        });
    
        test("It should call next with an error if the controller throws an error", async () => {
            const errorMessage = "Internal Server Error";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error(errorMessage));
    
            const nextMock = jest.fn();
    
            await request(app).get(baseURL + "/users").expect(503);
        });
        
    });

    describe("GET /users/roles/:role", () => {
        test("It returns an array of users with a specific role", async () => {
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testAdmin]);
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            
            const response = await request(app).get(baseURL + "/users/roles/Admin");
            
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin");
            expect(response.body).toEqual([testAdmin]);
        });
    
        test("It should fail if the role is not valid", async () => {
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            });
    
            const response = await request(app).get(baseURL + "/users/roles/Invalid");
    
            expect(response.status).toBe(422);
        });
    
        test("It should call next with an error if the controller throws an error", async () => {
            const errorMessage = "Internal Server Error";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new Error(errorMessage));
    
            const nextMock = jest.fn();
            await request(app).get(baseURL + "/users/roles/").expect(503);
        });
        
    });
    describe("GET /current", () => {
        test("It returns the currently logged in user", async () => {
            // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    
            // Simuliamo una richiesta GET alla route
            const response = await request(app).get(baseURL + "/sessions/current");
    
            // Verifichiamo che la risposta sia stata ricevuta correttamente
            expect(response.status).toBe(200);
            // Verifichiamo che il metodo isLoggedIn sia stato chiamato      
        });
    
        test("It should return a 401 error if the user is not logged in", async () => {
            // Mockiamo la funzione isLoggedIn per farla restituire un errore di utente non autorizzato
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    
            // Simuliamo una richiesta GET alla route
            const response = await request(app).get(baseURL + "/sessions/current");
    
            // Verifichiamo che la risposta contenga un codice di stato 401
            expect(response.status).toBe(401);
            // Verifichiamo che il metodo isLoggedIn sia stato chiamato
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
        });
    });
        
    describe("DELETE /current", () => {
       
        test("It logs out the currently logged in user and returns a 200 success code", async () => {
            // Mockiamo la funzione isLoggedIn per farla restituire un errore di utente non autorizzato
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValue(null);
            // Simuliamo una richiesta DELETE alla route
            const response = await request(app).delete(baseURL + "/sessions/current");
        
            // Verifichiamo che la risposta contenga un codice di stato 401
            expect(response.status).toBe(200);
        });
       
        test("It should return a 401 error if the user is not logged in", async () => {
            // Mockiamo la funzione isLoggedIn per farla restituire un errore di utente non autorizzato
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValue(null);
            const response = await request(app).delete(baseURL + "/sessions/current");
        
            // Verifichiamo che la risposta contenga un codice di stato 401
            expect(response.status).toBe(401);
        });
        test("It should return a 401 error if the user is not logged in", async () => {
            // Mockiamo la funzione isLoggedIn per farla restituire un errore di utente non autorizzato
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>next()) 
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "logout").mockRejectedValueOnce(new UnauthorizedUserError());
            const response = await request(app).delete(baseURL + "/sessions/current");
            // Verifichiamo che la risposta contenga un codice di stato 401
            expect(response.status).toBe(401);
        });
    });
    describe("PATCH /:username", () => {
        const testUser = {
            name: "John",
            surname: "Doe",
            username: "testUser",
            role: Role.ADMIN,
            address: "123 Street",
            birthdate: "1990-01-01"
        };
    
        test("It updates user information for admin users", async () => {
            // Mocking isLoggedIn middleware to return next middleware
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(new User("NewName", "NewSurname", "testUser", Role.ADMIN, "NewAddress", "1995-01-01"));
    
            const response = await request(app)
                .patch(baseURL + "/users/testUser")
                .send({
                    name: "NewName",
                    surname: "NewSurname",
                    address: "NewAddress",
                    birthdate: "1995-01-01"
                });
    
            expect(response.status).toBe(200);
            expect(response.body).toEqual(new User("NewName", "NewSurname", "testUser", Role.ADMIN, "NewAddress", "1995-01-01"));
        });
    
        test("It should reject with error because the date is after the current date", async () => {
            // Mocking isLoggedIn middleware to return next middleware
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new DateError());
    
            const response = await request(app)
                .patch(baseURL + "/users/testUser")
                .send({
                    name: "NewName",
                    surname: "NewSurname",
                    address: "NewAddress",
                    birthdate: "2026-01-01"
                });
    
            expect(response.status).toBe(400);
        });
    
        test("It should return a 401 error if the user is not authenticated", async () => {
            // Mocking isLoggedIn middleware to return unauthorized error
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    
            const response = await request(app)
                .patch(baseURL + "/users/testUser")
                .send({
                    name: "NewName",
                    surname: "NewSurname",
                    address: "NewAddress",
                    birthdate: "1995-01-01"
                });
    
            expect(response.status).toBe(401);
        });
    
        // You can write similar tests for other scenarios like non-admin users editing other users' info,
        // invalid birthdate, etc.
    });
    
    describe("GET /:username", () => {
        test("It should return the user with the specified username", async () => {
            // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            const testUser = new User("testUsername", "testName", "testSurname", Role.CUSTOMER, "testAddress", "1990-01-01")
            // Mockiamo il metodo getUserByUsername per farlo restituire un utente di esempio
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);
            
            // Simuliamo una richiesta GET alla route con un username specifico
            const response = await request(app).get(baseURL + "/users/testUsername");
    
            // Verifichiamo che la risposta sia stata ricevuta correttamente
            expect(response.status).toBe(200);
            // Verifichiamo che il corpo della risposta contenga i dettagli dell'utente richiesto
            expect(response.body).toEqual(testUser);
        });
    
        test("It should call next with an error if the controller throws an error", async () => {
            const errorMessage = "Internal Server Error";
    
            // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            // Mockiamo il metodo getUserByUsername per farlo restituire un errore
            jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotAdminError());
            
            // Simuliamo una richiesta GET alla route
            const nextMock = jest.fn();
            await request(app).get(baseURL + "/users/testUsername").expect(401);
        });
    });

    describe("DELETE /:username", () => {
        test("It should delete the user with the specified username and return a 200 success code", async () => {
            // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            // Mockiamo la funzione validateRequest per farla restituire il prossimo middleware
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            // Mockiamo il metodo deleteUser per confermare l'eliminazione dell'utente
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            
            // Simuliamo una richiesta DELETE alla route con un username specifico
            const response = await request(app).delete(baseURL + "/users/testUsername");
            
            // Verifichiamo che la risposta sia stata ricevuta correttamente
            expect(response.status).toBe(200);
        });
    
        test("It should call next with an error if the controller throws an error", async () => {
            const errorMessage = "Internal Server Error";
    
            // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            // Mockiamo la funzione validateRequest per farla restituire il prossimo middleware
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            // Mockiamo il metodo deleteUser per farlo restituire un errore
            jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new Error(errorMessage));
            
            // Simuliamo una richiesta DELETE alla route
            const nextMock = jest.fn();
            await request(app).delete(baseURL + "/users/testUsername").expect(503);
            
            
        });

    });
    describe("DELETE /", () => {
    test("It should delete all users and return a 200 success code", async () => {
        // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        // Mockiamo la funzione isAdmin per farla restituire il prossimo middleware
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
        // Mockiamo la funzione validateRequest per farla restituire il prossimo middleware
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        // Mockiamo il metodo deleteAll per confermare l'eliminazione di tutti gli utenti
        jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
        
        // Simuliamo una richiesta DELETE alla route
        const response = await request(app).delete(baseURL + "/users");
        
        // Verifichiamo che la risposta sia stata ricevuta correttamente
        expect(response.status).toBe(200);
    });

    test("It should return a 401 error if the user is not an admin", async () => {
        const errorMessage = "Unauthorized";
        
        // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        // Mockiamo la funzione isAdmin per farla restituire un errore
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: errorMessage });
        });
        // Mockiamo la funzione validateRequest per farla restituire il prossimo middleware
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        
        // Simuliamo una richiesta DELETE alla route
        const response = await request(app).delete(baseURL + "/users");
        
        // Verifichiamo che la risposta contenga un codice di stato 401
        expect(response.status).toBe(401);
    });

    test("It should call next with an error if the controller throws an error", async () => {
        const errorMessage = "Internal Server Error";

        // Mockiamo la funzione isLoggedIn per farla restituire il prossimo middleware
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        // Mockiamo la funzione isAdmin per farla restituire il prossimo middleware
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
        // Mockiamo la funzione validateRequest per farla restituire il prossimo middleware
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        // Mockiamo il metodo deleteAll per farlo restituire un errore
        jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new Error(errorMessage));
        
        // Simuliamo una richiesta DELETE alla route
        const nextMock = jest.fn();
        await request(app).delete(baseURL + "/users").expect(503);
    
    });
});

    
    
    

    
    
})
