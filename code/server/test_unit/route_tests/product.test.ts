import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import ProductController from "../../src/controllers/productController"
import Authenticator from "../../src/routers/auth"
import { Product, Category } from "../../src/components/product"
import ErrorHandler from "../../src/helper"
import dayjs from "dayjs"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, ArrivalDateError} from "../../src/errors/productError";

const baseURL = "/ezelectronics"

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
});

jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

describe("Product route unit tests", () => {
    describe("POST /products", () => {

        test("It should return a 200 success code", async () => {
            const testProduct = {    
                sellingPrice: 1000,
                model: "test",
                category: Category.APPLIANCE,
                quantity: 10
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    isFloat: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()


            const response = await request(app).post(baseURL + "/products").send(testProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                undefined,
                testProduct.sellingPrice,
                dayjs().format("YYYY-MM-DD")
            )
        })

        test("It should return a 422 error code if the date is wrong", async () => {
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **arrivalDate** - Reason: *Invalid value* - Location: *body*\n\n"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    isFloat: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ArrivalDateError)
    
            const newProduct = {
                model: "testModel",
                category: Category.APPLIANCE,
                quantity: 10,
                details: "Test details",
                sellingPrice: 99.99,
                arrivalDate: dayjs().format("DD-MM-YYYY")
            }
    
            const response = await request(app)
                .post(baseURL + `/products`)
                .send(newProduct)

            expect(response.status).toBe(422)
            expect(response.body.error).toBe(errorMessage)
        })
        
        test("It should return a 409 error code if an error occurs during product registration", async () => {
            const errorMessage = "The product already exists"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    isFloat: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError)
    
            const newProduct = {
                model: "testModel",
                category: Category.APPLIANCE,
                quantity: 10,
                details: "Test details",
                sellingPrice: 99.99,
                arrivalDate: dayjs().format("YYYY-MM-DD")
            }
    
            const response = await request(app)
                .post(baseURL + `/products`)
                .send(newProduct)

            expect(response.status).toBe(409)
            expect(response.body.error).toBe(errorMessage)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    
            const newProduct = {
                model: "testModel",
                category: Category.APPLIANCE,
                quantity: 10,
                details: "Test details",
                sellingPrice: 99.99,
                arrivalDate: "2024-05-31"
            }
    
            const response = await request(app)
                .post(baseURL + `/products`)
                .send(newProduct)

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });

        test("It should fail if the user is not an Admin or a Maanger", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const newProduct = {
                model: "testModel",
                category: Category.APPLIANCE,
                quantity: 10,
                details: "Test details",
                sellingPrice: 99.99,
                arrivalDate: "2024-05-31"
            }
    
            const response = await request(app)
                .post(baseURL + `/products`)
                .send(newProduct)

            expect(response.status).toBe(401)
        })


    })

    describe("PATCH /products/:model", () => {

        test("It should return a 200 success code and call changeProductQuantity method", async () => {
            const testModel = "testModel"
            const testQuantity = 10
            const testChangeDate = dayjs().format("YYYY-MM-DD")
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(()=>({
                    isString: () => ({ isLength: () => ({}) }),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(testQuantity)
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}`)
                .send({ quantity: testQuantity, changeDate: testChangeDate })
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testModel, testQuantity, testChangeDate)
        })

        test("It should return a 200 success code and call changeProductQuantity method with null date", async () => {
            const testModel = "testModel"
            const testQuantity = 10
            const testChangeDate = dayjs().format("YYYY-MM-DD")
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(()=>({
                    isString: () => ({ isLength: () => ({}) }),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(testQuantity)
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}`)
                .send({ quantity: testQuantity, changeDate: null })
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testModel, testQuantity, testChangeDate)
        })

        test("It should return a 404 error code if an error occurs during changing product quantity", async () => {
            const testModel = "testModel"
            const errorMessage = "Product not found"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(()=>({
                    isString: () => ({ isLength: () => ({}) }),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError)
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}`)
                .send({ quantity: 5, changeDate: "2024-05-31" })
    
            expect(response.status).toBe(404)
            expect(response.body.error).toBe(errorMessage)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    
            const testModel = "testModel"
            const testQuantity = 10    
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}`)
                .send({ quantity: testQuantity, changeDate: null })

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });

        test("It should fail if the user is not an Admin or a Maanger", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const testModel = "testModel"
            const testQuantity = 10
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}`)
                .send({ quantity: testQuantity, changeDate: null })

            expect(response.status).toBe(401)
        })

    })

    describe("PATCH /products/:model/sell", () => {

        test("It should return a 200 success code and call sellProduct method", async () => {
            const testModel = "testModel"
            const testQuantity = 5
            const testSellingDate = dayjs().format("YYYY-MM-DD")
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(()=>({
                    isString: () => ({ isLength: () => ({}) }),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(testQuantity)
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}/sell`)
                .send({ quantity: testQuantity, sellingDate: testSellingDate })
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testModel, testQuantity, testSellingDate)
        })

        test("It should return a 200 success code and call sellProduct method with null date", async () => {
            const testModel = "testModel"
            const testQuantity = 5
            const testSellingDate = dayjs().format("YYYY-MM-DD")
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(()=>({
                    isString: () => ({ isLength: () => ({}) }),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(testQuantity)
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}/sell`)
                .send({ quantity: testQuantity, sellingDate: null })
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testModel, testQuantity, testSellingDate)
        })

        test("It should return a 409 error code if an error occurs during selling a product", async () => {
            const testModel = "testModel"
            const errorMessage = "Product stock cannot satisfy the requested quantity"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                })),
                param: jest.fn().mockImplementation(()=>({
                    isString: () => ({ isLength: () => ({}) }),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError)
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}/sell`)
                .send({ quantity: 5, sellingDate: "2024-05-31" })
    
            expect(response.status).toBe(409)
            expect(response.body.error).toBe(errorMessage)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    
            const testModel = "testModel"
            const testQuantity = 10    
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}/sell`)
                .send({ quantity: testQuantity, sellingDate: null })

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });

        test("It should fail if the user is not an Admin or a Maanger", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const testModel = "testModel"
            const testQuantity = 10
    
            const response = await request(app)
                .patch(`${baseURL}/products/${testModel}/sell`)
                .send({ quantity: testQuantity, sellingDate: null })

            expect(response.status).toBe(401)
        })
        
    })

    describe("GET /products", () => {

        test("It should return a 200 success code and call getProducts method with correct parameters", async () => {
            const testGrouping = "category"
            const testCategory = Category.APPLIANCE
            const testModel = "testModel"

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([])
    
            const response = await request(app)
                .get(`${baseURL}/products`)
                .query({ grouping: testGrouping, category: testCategory })
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(testGrouping, testCategory, undefined)
        })

        test("It should return a 503 error code if an error occurs during retrieval of products", async () => {
            const errorMessage = "Internal Server Error"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new Error(errorMessage))
    
            const response = await request(app)
                .get(`${baseURL}/products`)
                .query({ grouping: "category", category: Category.APPLIANCE})
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    
            const testGrouping = "category"
            const testCategory = Category.APPLIANCE
            const testModel = "testModel"
    
            const response = await request(app)
                .get(`${baseURL}/products`)
                .query({ grouping: testGrouping, category: testCategory })

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });

        test("It should fail if the user is not an Admin or a Maanger", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const testGrouping = "category"
            const testCategory = Category.APPLIANCE
            const testModel = "testModel"
    
            const response = await request(app)
                .get(`${baseURL}/products`)
                .query({ grouping: testGrouping, category: testCategory })

            expect(response.status).toBe(401)
        })
    })

    describe("GET /products/available", () => {

        test("It should return a 200 success code and call getAvailableProducts method with correct parameters", async () => {
            const testGrouping = "category"
            const testModel = "testModel"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([])
    
            const response = await request(app)
                .get(`${baseURL}/products/available`)
                .query({ grouping: testGrouping, model: testModel })
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(testGrouping, undefined, testModel)
        })

        test("It should return a 404 error code if an error occurs during retrieval of available products", async () => {
            const errorMessage = "Product not found"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    optional: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError)
    
            const response = await request(app)
                .get(`${baseURL}/products/available`)
                .query({ grouping: "category", category: "Appliance", model: "testModel" })
    
            expect(response.status).toBe(404)
            expect(response.body.error).toBe(errorMessage)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
    
            const testGrouping = "category"
            const testCategory = Category.APPLIANCE
            const testModel = "testModel"
    
            const response = await request(app)
                .get(`${baseURL}/products/available`)
                .query({ grouping: testGrouping, model: testModel })

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });

    })

    describe("DELETE /products", () => {

        test("It should return a 200 success code and call deleteAllProducts method", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
    
            const response = await request(app)
                .delete(`${baseURL}/products`)
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled()
        })

        test("It should return a 503 error code if an error occurs during deletion", async () => {
            const errorMessage = "Internal Server Error"
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new Error(errorMessage))
    
            const response = await request(app)
                .delete(`${baseURL}/products`)
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());

            const response = await request(app)
                .delete(`${baseURL}/products`)

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });

        test("It should fail if the user is not an Admin or a Maanger", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            const response = await request(app)
                .delete(`${baseURL}/products`)

            expect(response.status).toBe(401)
        })
        
    })

    describe("DELETE /products/:model", () => {
        
        test("It should return a 200 success code and call deleteProduct method with correct parameters", async () => {
            const testModel = "testModel"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
    
            const response = await request(app)
                .delete(`${baseURL}/products/${testModel}`)
    
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(testModel)
        })

        test("It should return a 503 error code if an error occurs during deletion", async () => {
            const testModel = "testModel"
            const errorMessage = "Internal Server Error"
    
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                })),
            }))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
    
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
    
            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new Error(errorMessage))
    
            const response = await request(app)
                .delete(`${baseURL}/products/${testModel}`)
    
            expect(response.status).toBe(503)
            expect(response.body.error).toBe(errorMessage)
        })
        
        test("It should return a 401 error code if the user is not logged in", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            const testModel = "testModel"

            const response = await request(app)
                .delete(`${baseURL}/products/${testModel}`)

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });

        test("It should fail if the user is not an Admin or a Maanger", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();})

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            const testModel = "testModel"
            
            const response = await request(app)
                .delete(`${baseURL}/products/${testModel}`)

            expect(response.status).toBe(401)
        })
    })
})