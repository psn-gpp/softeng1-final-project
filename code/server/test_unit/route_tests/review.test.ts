import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach, jest } from "@jest/globals"
import request from "supertest";
import { app } from "../../index" // Assuming your Express app is exported from app.ts
import ReviewController from "../../src/controllers/reviewController";
import Authenticator from "../../src/routers/auth";
import ErrorHandler from "../../src/helper"
import { ProductReview } from "../../src/components/review";
import { Role } from "../../src/components/user"; // Assuming Role is defined here
import dayjs from "dayjs";
import { ExistingReviewError,NoExistingProductError } from "../../src/errors/reviewError";

const baseURL = "/ezelectronics"

 


jest.mock("../../src/controllers/reviewController");
jest.mock("../../src/routers/auth");


describe("Review Routes", () => {
    
    describe("POST /reviews/:model", () => { // pk
        test("It should return a 200 success code", async () => {
            const mockModel = "product";
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
            const inputReview = { model: mockModel, user: inputUser,score: 5, comment: "Great product!" };
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser; // Set the inputUser object in the request object
                next();
            });
            jest.spyOn(Authenticator.prototype,   "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce();
    
            const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.addReview).toHaveBeenCalled();
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(mockModel, inputUser, inputReview.score, inputReview.comment);
        });

        test("It should return a 409 error code if an error occurs during product registration", async () => {
            const errorMessage = "You have already reviewed this product"
            const mockModel = "product";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError)
    
            const inputReview = { model: mockModel, score: 5, comment: "Great product!" };
    
            const response = await request(app)
                .post(baseURL + "/reviews/" + mockModel)
                .send(inputReview)
    
            expect(response.status).toBe(409)
            expect(response.body.error).toBe(errorMessage)
        })

        test("It should return a 401 error code if user is not logged in", async () => {
             const mockModel = "product";
            const inputReview = { model: mockModel, score: 5, comment: "Great product!" };
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
    
            const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
            expect(response.status).toBe(401);
        });






       /* test("It should return a 422 error code if model is missing or invalid", async () => {
            const mockModel='model';
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
            const inputReview = {  user: inputUser, score: 5, comment: "Great product!" };
    
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
              //  req.user = inputUser; // Set the inputUser object in the request object
                return next();
             });
            jest.spyOn(Authenticator.prototype,   "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce();
            const response = await request(app).post(baseURL + "/reviews/"+mockModel).send(inputReview);
            expect(response.status).toBe(422);
            
        });*/



       /* test("It should return a 503 error code if an error occurs in controller", async () => {
            const errorMessage = "Internal Server Error"

            const mockModel = "product";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new Error(errorMessage))
    
    
            const response = await request(app)
                .post(baseURL + "/reviews/" + mockModel)
                 
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })*/

    
       test("It should return a 422 error code for invalid score", async () => {
        const mockModel = "product";
        const inputReview = { model: mockModel, score: 6, comment: "Great product!" }; //invalid score
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
            
           
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            });
    
            const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
            expect(response.status).toBe(422);
        });

         test("It should return a validation error if 'comment' is missing", async () => {
            const mockModel = "product";
            const inputReview = { model: mockModel, score:5   }; 
          const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            });
    
            const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
            expect(response.status).toBe(422);
        }); 
        test("It should return a 401 error code if user is not a customer", async () => {
            const inputReview = { score: 5, comment: "Great product!" };
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.ADMIN,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
            const mockModel = "product";
    
           
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user =inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Forbidden" });
            });
    
            const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
            expect(response.status).toBe(401);
        });

        

        


            test("It should return a validation error if 'score' is missing", async () => {
                const inputReview = { comment: "Great product!" }; // missing score
               const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
                const mockModel = "product";
        
                 
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    req.user =inputUser;
                    next();
                });
                jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return res.status(422).json({ error: "Validation error" });
                });
        
                const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
                expect(response.status).toBe(422);
            });
    });
    
    describe("GET /reviews/:model", () => {
       
        test("It should return a 200 success code and reviews for a valid model", async () => {
            const mockModel = "product";
            const mockReviews = [
                {
                    model: mockModel,
                    user: 'username',
                    score: 5,
                    date: dayjs().format('YYYY-MM-DD'),
                    comment: "Great product!"
                }
            ];
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                next();
            });
        
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                next();
            });
        
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce(mockReviews);
        
            const response = await request(app).get(baseURL + "/reviews/" + mockModel);
        
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockReviews);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(mockModel);
        });

        test("It should return a 401 error code if user is not logged in", async () => {
            const mockModel = "product";

    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
    
            const response = await request(app).get(baseURL + "/reviews/" + mockModel);
            expect(response.status).toBe(401);
        });


        test("It should return a 503 error code if an error occurs in controller", async () => {
            const errorMessage = "Internal Server Error"

            const mockModel = "product";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce(new Error(errorMessage))
    
    
            const response = await request(app)
                .get(baseURL + "/reviews/" + mockModel)
                 
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })


       

       /* test("It should return a 422 error code if model is missing or invalid", async () => {
            const mockModel='model';
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
            const inputReview = {  user: inputUser, score: 5, comment: "Great product!" };
            const mockReviews = [
                {
                    model: mockModel,
                    user: 'username',
                    score: 5,
                    date: dayjs().format('YYYY-MM-DD'),
                    comment: "Great product!"
                }
            ];

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));


           


            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
             //   req.user = inputUser; // Set the inputUser object in the request object
                return next();
             });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });

            jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce(mockReviews);
    
            const response = await request(app).get(baseURL + "/reviews/"+mockModel)
            expect
            expect(response.status).toBe(422);
        });
*/



       /* test("It should fail if the model is not valid", async () => {
            //jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            });
    
            const response = await request(app).get(baseURL + "/reviews/InvalidModel");
    
            expect(response.status).toBe(422);
        });*/





        /*test("It should return a validation error if 'model' is not a string", async () => {
            const inputReview = { score: 5, comment: "Great product!" };
            const mockUser = { username: "testUser" };
            const mockModel = 123; // invalid model type
    
            
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = mockUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error" });
            });
    
            const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
            expect(response.status).toBe(422);
        });
 */

        /* test("It should return a 422 error code for invalid model", async () => {
            const mockModel = 1;
            const inputReview = { model: mockModel, score: 5, comment: "Great product!" }; 
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
                
               
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    req.user = inputUser;
                    next();
                });
                jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return res.status(422).json({ error: "Validation error" });
                });
        
                const response = await request(app).post(baseURL + "/reviews/" + mockModel).send(inputReview);
                expect(response.status).toBe(422);
            });*/
        })


    describe("DELETE /reviews/:model", () => {
        test("It should delete the review and return a 200 success code", async () => {
            const mockModel = "product";
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
            //const mockUser = { username: "testUser" }
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce();

            const response = await request(app).delete(baseURL + "/reviews/" + mockModel);
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(mockModel,inputUser);
        });
        test("It should return a 401 error code if user is not logged in", async () => {
            const mockModel = "product";
           
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app).delete(baseURL + "/reviews/" + mockModel);
            expect(response.status).toBe(401);
        });

        

        test("should return a 401 error code if user is not a customer", async () => {
            const mockModel='product'
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).delete(baseURL + "/reviews/" + mockModel);
            expect(response.status).toBe(401);
        })


        test("It should return a 503 error code if an error occurs during review deletion", async () => {
            const errorMessage = "Internal Server Error"

            const mockModel = "product";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new Error(errorMessage))
    
    
            const response = await request(app)
                .delete(baseURL + "/reviews/" + mockModel)
                 
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })



        /*test("It should return a 422 error code if model is missing or invalid", async () => {
            const mockModel='model';
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
            const inputReview = {  user: inputUser, score: 5, comment: "Great product!" };
    
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
              //  req.user = inputUser; // Set the inputUser object in the request object
                return next();
             });
            jest.spyOn(Authenticator.prototype,   "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: [{ msg: "Invalid value" }] });
            });
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce();
            const response = await request(app).delete(baseURL + "/reviews/"+mockModel)
            expect(response.status).toBe(422);
            
        });*/




    });

    describe("DELETE /reviews/:model/all", () => {
        test("It should delete reviews for a product and return a 200 success code for admin or manager", async () => {
            const mockModel = "product";
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.ADMIN,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };

        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce();
        
            const response = await request(app).delete(baseURL + "/reviews/" + mockModel + "/all");
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(mockModel);
        });

        test("It should return a 401 error code for non-admin or non-manager", async () => {
            const mockModel = "product";
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };// Non-admin or non-manager user
          
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                // Simulate non-admin or non-manager behavior
                res.status(401).json({ error: "Unauthorized" });
            });
        
            const response = await request(app).delete(baseURL + "/reviews/" + mockModel + "/all");
            expect(response.status).toBe(401);
        });

        test("It should return a 401 error code if user is not logged in", async () => {
            const mockModel = "product";
           
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app).delete(baseURL + "/reviews/" + mockModel + "/all");
            expect(response.status).toBe(401);
        });

        test("It should return a 503 error code if an error occurs during review deletion", async () => {
            const errorMessage = "Internal Server Error"

            const mockModel = "product";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new Error(errorMessage))
    
    
            const response = await request(app)
                .delete(baseURL + "/reviews/" + mockModel+"/all" );
                 
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })





       /*  test("It should return a 422 error code if model is missing or invalid", async () => {
            const mockModel='model';
           
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
              //  req.user = inputUser; // Set the inputUser object in the request object
                return next();
             });
            jest.spyOn(Authenticator.prototype,   "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce();
            const response = await request(app).delete(baseURL + "/reviews/" + mockModel + "/all")
            expect(response.status).toBe(422);
            
        });
        */

      

    });



    describe("DELETE /reviews", () => {
        test("It should delete all reviews successfully", async () => {
    
             const inputUser = { username: "test", name: "test", surname: "test", role: Role.ADMIN,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };    
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce();
        
            const response = await request(app).delete(baseURL + "/reviews");
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith();
        });
      


        test("It should return a 401 error code if user is not logged in", async () => {
            const mockModel = "product";
           
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app).delete(baseURL + "/reviews");
            expect(response.status).toBe(401);
        });
         

        test("It should return a 401 error code for non-admin or non-manager", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", role: Role.CUSTOMER,address: 'address', birthdate: dayjs().format('YYYY-MM-DD') }; // Non-admin or non-manager user
        
            
        
            // Mock isLoggedIn middleware to set the user role
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = inputUser;
                next();
            });
        
            // Mock isAdminOrManager middleware to send 401 status for non-admin/non-manager
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });
        
            // Make the DELETE request
            const response = await request(app).delete(baseURL + "/reviews");
        
            // Check if the status code is 401
            expect(response.status).toBe(401);
        });
        

        test("It should return a 503 error code if an error occurs during review deletion", async () => {
            const errorMessage = "Internal Server Error"

            const mockModel = "product";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockRejectedValueOnce(new Error(errorMessage))
    
    
            const response = await request(app)
                .delete(baseURL + "/reviews" );
                 
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })

    });

    
});
    


 

