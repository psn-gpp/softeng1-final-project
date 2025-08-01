import { describe, test, expect, beforeAll, afterEach, jest } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import Authenticator from "../../src/routers/auth"
import request from "supertest"
import { Cart, ProductInCart } from "../../src/components/cart"
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from '../../src/errors/cartError'
import ErrorHandler from "../../src/helper"
import CartRoutes from "../../src/routers/cartRoutes"
import { Role, User } from "../../src/components/user"
import { Category, Product } from "../../src/components/product"
import { response } from "express"
import { app } from "../../index"
import { ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/controllers/cartController")
jest.mock("../../src/routers/auth")


const customer = {name:"test",surname: "test",password: "test",role: Role.CUSTOMER, address:"test",birthdate: "test"}
const admin = {name:"test",surname: "test",password: "test",role: Role.ADMIN, address:"test",birthdate: "test"}
const manager = {name:"test",surname: "test",password: "test",role: Role.MANAGER, address:"test",birthdate: "test"}
const prodsInCart : ProductInCart[] = [new ProductInCart("test1",10,Category.APPLIANCE, 100),new ProductInCart("test2",10,Category.APPLIANCE, 100)]
// @ts-ignore
const cart : Cart = new Cart(customer.name, false, null, 2000, prodsInCart)
const prod = new Product(100, 'test3',Category.APPLIANCE,null, null, 10)
const cartID = 10;

const error = new Error("Error")

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

// const mockErrorHandler = jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
//     return next();
// });

const baseURL = "/ezelectronics/carts"

describe("GET /", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 and the cart if the user is a logged in customer", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCart' ).mockResolvedValue(cart)

        const response = await request(app).get(baseURL + "/")

        expect(response.status).toBe(200)
        expect(response.body).toEqual(cart)

        expect(mockGetCart).toHaveBeenCalled()
    }, 15000)

    test("should return error if the user is not logged in", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCart' ).mockResolvedValue(cart)

        const response = await request(app).get(baseURL + "/")

        expect(response.status).toBe(401)
        // expect(response.error).toThrowError("Unauthenticated user")

        expect(mockGetCart).toHaveBeenCalledTimes(0)
    }, 15000)

    test("should return status error if the user is not a customer", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCart' ).mockResolvedValue(cart)

        const response = await request(app).get(baseURL + "/")

        expect(response.status).toBe(401)
        // expect(response.error).toThrowError("User is not a customer")

        expect(mockGetCart).toHaveBeenCalledTimes(0)
    }, 15000)

    test("should return error if getCart fails", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCart' ).mockRejectedValue(new Error("Error"))

        const response = await request(app).get(baseURL + "/")

        expect(response.status).toBe(503)

        expect(mockGetCart).toHaveBeenCalledTimes(1)
    }, 15000)

})


describe("POST /", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 if the user is a logged in customer and model exists, string, not empty", async () => {
        const product = {model:"prod"}

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'addToCart' ).mockResolvedValue(true)

        const response = await request(app).post(baseURL + "/", ).send(product)

        expect(response.status).toBe(200)

        expect(mockAddToCart).toHaveBeenCalled()

    }, 15000)

    test("should return status 422 if the user is a logged in customer and model exists, string, empty", async () => {
        const product = {model:""}

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'addToCart' ).mockResolvedValue(true)

        const response = await request(app).post(baseURL + "/", ).send(product)

        expect(response.status).toBe(422)

    }, 15000)


    test("should return status 422 if the user is a logged in customer and model exists, not string", async () => {
        const product = {model: 10}

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'addToCart' ).mockResolvedValue(true)

        const response = await request(app).post(baseURL + "/", ).send(product)

        expect(response.status).toBe(422)

    }, 15000)

    test("should return status 422 if the user is a logged in customer and model not exists", async () => {
        const product = {}

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'addToCart' ).mockResolvedValue(true)

        const response = await request(app).post(baseURL + "/", ).send(product)

        expect(response.status).toBe(422)

    }, 15000)

    test("should return status 503 if addToCart rejects", async () => {
        const product = {model:"prod"}

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'addToCart' ).mockRejectedValue(new Error("Error"))

        const response = await request(app).post(baseURL + "/", ).send(product)

        expect(response.status).toBe(503)

        expect(mockAddToCart).toHaveBeenCalled()

    }, 15000)


})


describe("PATCH /", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 and the cart if the user is a logged in customer", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockCheckoutCart = jest.spyOn(CartController.prototype, 'checkoutCart' ).mockResolvedValue(true)

        const response = await request(app).patch(baseURL + "/")

        expect(response.status).toBe(200)

        expect(mockCheckoutCart).toHaveBeenCalled()
    }, 15000)


    test("should return status 401 if user is not logged in", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockCheckoutCart = jest.spyOn(CartController.prototype, 'checkoutCart' ).mockResolvedValue(true)

        const response = await request(app).patch(baseURL + "/")

        expect(response.status).toBe(401)

    }, 15000)
    
    test("should return status 401 if user is not a customer", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })       
        })

        const mockCheckoutCart = jest.spyOn(CartController.prototype, 'checkoutCart' ).mockResolvedValue(true)

        const response = await request(app).patch(baseURL + "/")

        expect(response.status).toBe(401)

    }, 15000)

    test("should return 503 if checkoutCart rejects", async () => {
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockCheckoutCart = jest.spyOn(CartController.prototype, 'checkoutCart' ).mockRejectedValue(new Error("Error"))

        const response = await request(app).patch(baseURL + "/")

        expect(response.status).toBe(503)

        expect(mockCheckoutCart).toHaveBeenCalled()
    }, 15000)

})



describe("GET /history", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 and the cart if the user is a logged in customer", async () => {
        const carts = [cart,cart,cart]
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCustomerCarts' ).mockResolvedValue(carts)

        const response = await request(app).get(baseURL + "/history")

        expect(response.status).toBe(200)
        expect(response.body).toEqual(carts)

        expect(mockGetCart).toHaveBeenCalled()
    }, 15000)


    test("should return status 503 if getCustomerCarts rejects", async () => {
        const carts = [cart,cart,cart]
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCustomerCarts' ).mockRejectedValue(error)

        const response = await request(app).get(baseURL + "/history")

        expect(response.status).toBe(503)

        expect(mockGetCart).toHaveBeenCalled()
    }, 15000)


    test("should return status 401 if user is not a customer", async () => {
        const carts = [cart,cart,cart]
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCustomerCarts' ).mockResolvedValue(carts)

        const response = await request(app).get(baseURL + "/history")

        expect(response.status).toBe(401)
    }, 15000)


    test("should return status 401 if user is not logged in", async () => {
        const carts = [cart,cart,cart]
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next()
        })

        const mockGetCart = jest.spyOn(CartController.prototype, 'getCustomerCarts' ).mockResolvedValue(carts)

        const response = await request(app).get(baseURL + "/history")

        expect(response.status).toBe(401)
    }, 15000)


})


describe("DELETE /products/:model", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 if the user is a logged in customer and model exists, string (alphanumeric), not empty", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'removeProductFromCart' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/products/prod" )

        expect(response.status).toBe(200)

        expect(mockAddToCart).toHaveBeenCalled()

    }, 15000)


    // test("should return status 200 if model is not string", async () => {

    //     const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
    //         return next();
    //     })
    //     const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
    //         return next();
    //     })

    //     const mockAddToCart = jest.spyOn(CartController.prototype, 'removeProductFromCart' ).mockResolvedValue(true)

    //     const response = await request(app).delete(baseURL + `/products/${10}` )

    //     expect(response.status).toBe(200)

    // }, 15000)


    test("should return status 404 if model not defined", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        // const mockErrorHandler = jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        //     return res.status(422)
        // });

        const mockAddToCart = jest.spyOn(CartController.prototype, 'removeProductFromCart' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/products/" )

        expect(response.status).toBe(404)

    }, 15000)


    test("should return status 503 if removeProductFromCart rejects", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'removeProductFromCart' ).mockRejectedValue(error)

        const response = await request(app).delete(baseURL + "/products/model" )

        expect(response.status).toBe(503)

    }, 15000)


    
    test("should return status 404 if removeProductFromCart rejects with ProductNotFound", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockAddToCart = jest.spyOn(CartController.prototype, 'removeProductFromCart' ).mockRejectedValue(new ProductNotFoundError)

        const response = await request(app).delete(baseURL + "/products/model" )

        expect(response.status).toBe(404)

    }, 15000)
})



describe("DELETE /current", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 if the user is a logged in customer", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'clearCart' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/current" )

        expect(response.status).toBe(200)

        expect(mockClearCart).toHaveBeenCalled()

    }, 15000)

    
    test("should return status 401 if the user is not logged in", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'clearCart' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/current" )

        expect(response.status).toBe(401)

    }, 15000)


    test("should return status 401 if the user is not a customer", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next()
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'clearCart' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/current" )

        expect(response.status).toBe(401)

    }, 15000)

    
    test("should return status 404 if the user has not an unpaid cart", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'clearCart' ).mockRejectedValue(new CartNotFoundError)

        const response = await request(app).delete(baseURL + "/current" )

        expect(response.status).toBe(404)

        expect(mockClearCart).toHaveBeenCalled()

    }, 15000)

})


describe("DELETE /", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 if the user is a logged in admin or manager", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'deleteAllCarts' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/" )

        expect(response.status).toBe(200)

        expect(mockClearCart).toHaveBeenCalled()

    }, 15000)

    
    test("should return status 503 if deleteAllCarts rejects", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'deleteAllCarts' ).mockRejectedValue(error)

        const response = await request(app).delete(baseURL + "/" )

        expect(response.status).toBe(503)

        expect(mockClearCart).toHaveBeenCalled()

    }, 15000)


    test("should return status 401 if the user is not logged in", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'deleteAllCarts' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/" )

        expect(response.status).toBe(401)

    }, 15000)


    test("should return status 401 if the user is not an admin nor a manager", async () => {

        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next()
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an admin or manager", status: 401 })
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'deleteAllCarts' ).mockResolvedValue(true)

        const response = await request(app).delete(baseURL + "/" )

        expect(response.status).toBe(401)

    }, 15000)


})



describe("GET /all", () => {

    // afterEach(() => {
    //     jest.clearAllMocks();
    //     jest.restoreAllMocks();
    // });

    test("should return status 200 if the user is a logged in admin or manager", async () => {
        const carts = [cart, cart, cart]
        
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'getAllCarts' ).mockResolvedValue(carts)

        const response = await request(app).get(baseURL + "/all" )

        expect(response.status).toBe(200)
        expect(response.body).toEqual(carts)

        expect(mockClearCart).toHaveBeenCalled()

    }, 15000)


    test("should return status 200 if the user is a logged in admin or manager", async () => {
        const carts = [cart, cart, cart]
        
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next();
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'getAllCarts' ).mockResolvedValue(carts)

        const response = await request(app).get(baseURL + "/all" )

        expect(response.status).toBe(200)
        expect(response.body).toEqual(carts)

        expect(mockClearCart).toHaveBeenCalled()

    }, 15000)


    test("should return status 200 if the user is not logged in", async () => {
        const carts = [cart, cart, cart]
        
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return next();
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'getAllCarts' ).mockResolvedValue(carts)

        const response = await request(app).get(baseURL + "/all" )

        expect(response.status).toBe(401)

    }, 15000)


    
    test("should return status 503 if getAllCarts rejects", async () => {
        const carts = [cart, cart, cart]
        
        const mockIsLoggedIn = jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req, res, next) => {
            return next() 
        })
        const mockIsCustomer = jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req, res, next) => {
            return next()
        })

        const mockClearCart = jest.spyOn(CartController.prototype, 'getAllCarts' ).mockRejectedValue(error)

        const response = await request(app).get(baseURL + "/all" )

        expect(response.status).toBe(503)

    }, 15000)


})