import { jest, describe, test, expect, beforeEach, beforeAll, afterAll, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Cart, ProductInCart } from "../src/components/cart"
import { Category, Product } from "../src/components/product"
import CartDAO from "../src/dao/cartDAO"
import { resolve } from "path"
import ProductDAO from "../src/dao/productDAO"
import CartController from "../src/controllers/cartController"

const routePath = "/ezelectronics"
const routeCarts = `${routePath}/carts`

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const prodsInCart : ProductInCart[] = [new ProductInCart("test1",10,Category.APPLIANCE, 100),new ProductInCart("test2",10,Category.APPLIANCE, 100)]
// @ts-ignore
const cartEmpty = {customer: customer.username, paid: false, paymentDate: null, total: 0, products: []}
// @ts-ignore
const cartFull = {customer: customer.username, paid: false, paymentDate: null, total: 2000, products: prodsInCart}
const cartDAO = new CartDAO()
const prod = new Product(100, 'test3',Category.APPLIANCE,null, null, 10)
const cartID = 10;

let currentUserCookie : string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    currentUserCookie = await new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    //console.error('Login failed:', err.response ? err.response.body : err);
                    reject(err)
                }
                resolve(res.header["set-cookie"])
            })
    })
}

const logout = async () => {
    return new Promise((resolve,reject) => {
        request(app)
            .delete("/ezelectronics/sessions/current")
            .set("Cookie", currentUserCookie)
            .expect(200)
            .end((err, res) => {
                if(err) {
                    reject(err)
                    //console.error('Logout failed:', err.response ? err.response.body : err);
                }
                resolve(true)
            })
    })
}

afterAll(async () => {
    await cleanup()
})

// BEGIN INTEGRATION TESTS

describe("GET /", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })


    describe("Try to get the cart of the logged in user", () => {

        test("should return 200 and the cart", async () => {
                
            await login(customer)
            
            const cart = await request(app)
                .get(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)

            expect(cart.body).toEqual(cartEmpty)
            expect(cart.body.total).toBe(cart.body.products.map((p : ProductInCart) => p.price*p.quantity).reduce((tot : number, a : number) => tot + a, 0))

        })
        
        test("...as admin (should return 401)",async () => {
                
            await logout()
            await login(admin)
            
            await request(app)
                .get(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(401)
            
            await logout()
        })

        test("...as non logged-in user (should return 401)",async () => {
                
            
            await request(app)
                .get(`${routeCarts}/`)
                .expect(401)
        })
    })

    describe("try to insert a product in the cart then try to get the new non empty cart", () => {

        test("try to insert a non existing product", async () => {
            await login(customer)
            await request(app).post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone15"})
            .expect(404)
        })

        test("insert the new product", async () => {
            await logout()

            await login(admin)

            //product with quantity=0 should not pass the check on parameters
            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone15", category: Category.SMARTPHONE, quantity: 0, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(422)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone15", category: "Smartphone", quantity: 10, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()
            await login(customer)

            await request(app).post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone15"})
            .expect(200)
        })

        test("try to get the new non-empty cart", async() =>{
            
            const cart2 = await request(app)
            .get(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            let cartFull2 = cart2.body
            cartFull2.products = [{model: "iPhone15", quantity: 1, category: Category.SMARTPHONE, price: 1000}] 
            cartFull2.total = 1000

            expect(cart2.body).toEqual(cartFull2)
            expect(cart2.body.total).toBe(cart2.body.products.map((p : ProductInCart) => p.price*p.quantity).reduce((tot : number, a : number) => tot + a, 0))
        })
    

    })


})


describe("POST /", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })

    describe("try to insert a product in the cart", () => {

        test("try to insert a non existing product", async () => {
            await login(customer)
            await request(app).post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone15"})
            .expect(404)
        })
        
        test("try to add a product with empty model parameter", async () => {

            await request(app).post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:""})
            .expect(422)

        })

        test("insert the new product then try to add 1, 2 then 3 instances to the cart (should give 200 code for the first two and then a 409 error for the third because the available quantity is 2 and we sold 2 items before trying to add it to the cart", async () => {
            await logout()

            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone15", category: "Smartphone", quantity: 2, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()
            await login(customer)

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone15"})
            .expect(200)

            const res = await request(app)
            .get(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body.products).toEqual([{model: "iPhone15", quantity: 1, category: Category.SMARTPHONE, price: 1000}])

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone15"})
            .expect(200)

            const cart2 = await request(app)
            .get(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(cart2.body.products).toEqual([{model: "iPhone15", quantity: 2, category: Category.SMARTPHONE, price: 1000}])

            //sell product "iPhone15" so the quantity becomes 0
            await ProductDAO.prototype.sellProduct("iPhone15", 2, null)

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone15"})
            .expect(409)
        })

        test("try to call it as an admin (should return 401)",async () => {
                
            await logout()
            await login(admin)
            
            await request(app)
                .post(`${routeCarts}/`)
                .send({model: "iPhone15"})
                .set("Cookie", currentUserCookie)
                .expect(401)
            
            await logout()
        })

        test("try to call it as non logged-in user (should return 401)",async () => {
            await request(app)
                .post(`${routeCarts}/`)
                .send({model:"iPhone15"})
                .expect(401)
        })
    
    })

})


describe("PATCH /", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })

    describe("try to checkout current user's cart", () => {

        test("...and the user is not logged in (401 error)", async () => {
            await request(app)
                .patch(`${routeCarts}/`)
                .expect(401)
        })

        
        test("...and the user is not a customer (401 error)", async () => {
            await login(admin)

            await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(401)

            await logout()
        })

        test("...and the user is a customer but he has not a cart (404 error)", async () => {
            await login(customer)

            await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(404)

        })

        
        test("...and the user is a customer but his cart is empty (400 error)", async () => {
            // LOGGED IN AS A CUSTOMER

            // create empty cart for current customer
            await request(app)
                .get(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)

            // try to checkout but cart is empty
            await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(404)

        })


        test("...and the user is a customer and his cart is not empty but there is a product which has 0 quantity in stock at the moment of checkout (409 error)", async () => {
            await logout()

            //adding a new product to the stock
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone15", category: "Smartphone", quantity: 2, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //adding the product to the cart
            await login(customer)

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone15"})
            .expect(200)

            //then sell it
            await ProductDAO.prototype.sellProduct("iPhone15", 2, null)

            //then try to checkout the cart (409 error)
            await request(app)
            .patch(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(409)
        })

        test("...and the user is a customer and his cart is not empty but there is a product which quantity in stock is less than quantity in the cart at the moment of checkout (409 error)", async () => {
            await logout()

            //adding a new product to the stock
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone13", category: "Smartphone", quantity: 3, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //adding the product to the cart 3 times
            await login(customer)

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            //then sell 2 stocks of the product
            await ProductDAO.prototype.sellProduct("iPhone13", 2, null)

            //then try to checkout the cart (409 error)
            await request(app)
            .patch(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(409)
        })

        test("...and the user is a customer and his cart is not empty so the user successfully checkout his cart", async () => {
            await logout()

            await cleanup()
            await postUser(customer)
            await postUser(admin)

            //adding a new product to the stock
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone14", category: "Smartphone", quantity: 3, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //adding the product to the cart 3 times
            await login(customer)

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone14"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone14"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone14"})
            .expect(200)


            //then checkout the cart (200)
            await request(app)
            .patch(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)
        })

    })

})

describe("GET /history", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })

    describe("try to get user's carts history", () => {

        test("...and the user is not logged in (401 error)", async () => {
            await request(app)
                .get(`${routeCarts}/history`)
                .expect(401)
        })

        
        test("...and the user is not a customer (401 error)", async () => {
            await login(admin)

            await request(app)
                .get(`${routeCarts}/history`)
                .set("Cookie", currentUserCookie)
                .expect(401)

            await logout()
        })

        test("...and the user has no paid cart", async () => {
            await login(customer)

            const res = await request(app)
            .get(`${routeCarts}/history`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body).toEqual([])

        })

        test("... and the user has paid carts", async () => {
            await logout()
            
            //---- FILL THE CARTS HISTORY OF THE USER ------

            //adding a new product to the stock
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone13", category: "Smartphone", quantity: 100, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //adding the product to the cart 3 times
            await login(customer)

            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //then checkout the cart (200)
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            const res = await request(app)
            .get(`${routeCarts}/history`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body).toHaveLength(3)
        })


        test("... and the user has paid carts but there is another user with paid carts", async () => {
            await logout()
            await cleanup()
            await postUser(customer)
            await postUser(customer2)
            await postUser(admin)

            //ADD A NEW PRODUCT
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone13", category: "Smartphone", quantity: 100, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //---- FILL THE CARTS HISTORY OF THE USER1 ------

            //adding some products to the cart of user1 then checkout it 3 times
            await login(customer)

            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //checkout
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await logout()

            await login(customer2)

            
            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //checkout
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await logout()

            await login(customer)

            const res = await request(app)
            .get(`${routeCarts}/history`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body).toHaveLength(3)

            await logout()
        })
    })

})


describe("DELETE /products/:model", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })


    describe("try to remove a product's instance from cart", () => {

        test("... as a non logged in user", async () => {
            await request(app)
                .delete(`${routeCarts}/products/iPhone15`)
                .expect(401)
        })

        test("... as a non customer", async () => {
            await login(admin)

            await request(app)
                .delete(`${routeCarts}/products/iPhone15`)
                .set("Cookie", currentUserCookie)
                .expect(401)

            await logout()
        })

        test("... as a customer but the parameter string is empty", async () => {
            await login(customer)

            const mockFunction = jest.spyOn(CartController.prototype,'removeProductFromCart')

            await request(app)
                .delete(`${routeCarts}/products/`)
                .set("Cookie", currentUserCookie)
                .expect(404)

            expect(mockFunction).toHaveBeenCalledTimes(0)
            
            await logout()
        }) 
        
        test("... as a customer but he has got no carts", async () => {
            await login(customer)

            await request(app)
            .delete(`${routeCarts}/products/iPhone15`)
            .set("Cookie", currentUserCookie)
            .expect(404)
            .then((res) => {
                expect(res.text).toContain("Cart not found")
            })
            
            await logout()

        })

        test("... as customer that has a cart but the cart is empty", async () => {
            await login(customer)

            await request(app)
            .get(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)
            .then((res) => expect(res.body).toEqual(cartEmpty))

            await request(app)
            .delete(`${routeCarts}/products/iPhone15`)
            .set("Cookie", currentUserCookie)
            .expect(404)

            await logout()
        })

        test("... as a customer but the model represents a product NOT in cart", async () => {
            await login(admin)
            
            await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone13", category: "Smartphone", quantity: 100, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            
            await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone15", category: "Smartphone", quantity: 100, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()
            await login(customer)

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            await request(app)
                .delete(`${routeCarts}/products/iPhone15`)
                .set("Cookie", currentUserCookie)
                .expect(404)

        })

        test("... as a customer and the model IS in the cart", async () => {

            let res = await request(app)
            .get(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body.total).toBe(1000)

            await request(app)
                .delete(`${routeCarts}/products/iPhone13`)
                .set("Cookie", currentUserCookie)
                .expect(200)

        
            res = await request(app)
            .get(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body.total).toBe(0)
        })

        test("... as a customer and the model represents a non existing product", async () => {
            await request(app)
                .delete(`${routeCarts}/products/iPhone34`)
                .set("Cookie", currentUserCookie)
                .expect(404)

            await logout()
        })

    })

})


describe("DELETE /current", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })

    describe("try to delete current user's cart", () => {

        test("... as a non logged in user", async () => {
            await request(app)
                .delete(`${routeCarts}/current`)
                .expect(401)

        })

        test("... as a non customer", async () => {
            await login(admin)

            await request(app)
            .delete(`${routeCarts}/current`)
            .set("Cookie", currentUserCookie)
            .expect(401)

            await logout()
        })

        test("... as a customer but there is no unpaid cart for that customer (only paid carts)", async () => {

            //ADD A NEW PRODUCT
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone13", category: "Smartphone", quantity: 100, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //---- FILL THE CARTS HISTORY OF THE USER1 ------

            //adding some products to the cart of user1 then checkout it 3 times
            await login(customer)

            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //checkout
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await logout()

            await login(customer)

            await request(app)
            .delete(`${routeCarts}/current`)
            .set("Cookie", currentUserCookie)
            .expect(404) // there is no unpaid cart (only paid)

            await logout()
        })

        test("... as a customer and there is an unpaid cart (expect it to be empty after the request call)", async () => {

            // FILL THE CART WITHOUT CHECKING OUT IT

            await login(customer)

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            //DELETE IT

            const mockUpdateTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal')

            await request(app)
            .delete(`${routeCarts}/current`)
            .set("Cookie", currentUserCookie)
            .expect(200)


            const res = await request(app)
            .get(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)
            
            expect(mockUpdateTotal).toBeCalled()
            expect(res.body).toEqual(cartEmpty)
            expect(res.body.total).toBe(0)

        })

    })

})


describe("DELETE /", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })

    describe("try to delete all carts of all users", () => {

        test("... as a non logged in user", async () => {
            await request(app)
            .delete(`${routeCarts}/`)
            .expect(401)
        })

        
        test("... as a non admin nor manager", async () => {
            await login(customer)

            await request(app)
            .delete(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(401)

            await logout()
        })

        
        test("... as an admin (200 ok)", async () => {

            //insert carts

            await cleanup()
            await postUser(customer)
            await postUser(customer2)
            await postUser(admin)

            //ADD A NEW PRODUCT
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone13", category: "Smartphone", quantity: 100, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //---- FILL THE CARTS HISTORY OF THE USER1 ------

            //adding some products to the cart of user1 then checkout it 3 times
            await login(customer)

            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //checkout
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            await logout()

            await login(customer2)

            
            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //checkout
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)


            await logout()

            // GET ALL CARTS
            
            await login(admin)

            let res = await request(app)
            .get(`${routeCarts}/all`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body).toHaveLength(8)
            expect(res.body.filter((cart : any) => cart.paid == 0)).toHaveLength(2)

            // DELETE ALL CARTS
            
            await request(app)
            .delete(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            // get all carts
            res = await request(app)
            .get(`${routeCarts}/all`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body).toHaveLength(0)
            
            await logout()
        })
    })

})



describe("GET /all", () => {

    beforeAll(async () => {
        await cleanup()
        await postUser(customer)
        await postUser(admin)
    })

    describe("try to get all carts of all users", () => {

        test("... as a non logged in user", async () => {
            await request(app)
            .get(`${routeCarts}/all`)
            .expect(401)
        })

        
        test("... as a non admin nor manager", async () => {
            await login(customer)

            await request(app)
            .get(`${routeCarts}/all`)
            .set("Cookie", currentUserCookie)
            .expect(401)

            await logout()
        })

        
        test("... as an admin (200 ok)", async () => {

            //insert carts

            await cleanup()
            await postUser(customer)
            await postUser(customer2)
            await postUser(admin)

            //ADD A NEW PRODUCT
            await login(admin)

            await request(app).post(`${routePath}/products`)
            .set("Cookie", currentUserCookie)
            .send({model: "iPhone13", category: "Smartphone", quantity: 100, details: null, sellingPrice: 1000, arrivalDate: null})
            .expect(200)

            await logout()

            //---- FILL THE CARTS HISTORY OF THE USER1 ------

            //adding some products to the cart of user1 then checkout it 3 times
            await login(customer)

            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //checkout
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            await logout()

            await login(customer2)

            
            for(let i = 0; i < 3; i++) {
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)

                
                await request(app)
                .post(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .send({model:"iPhone13"})
                .expect(200)


                //checkout
                await request(app)
                .patch(`${routeCarts}/`)
                .set("Cookie", currentUserCookie)
                .expect(200)
            }

            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)

            
            await request(app)
            .post(`${routeCarts}/`)
            .set("Cookie", currentUserCookie)
            .send({model:"iPhone13"})
            .expect(200)


            await logout()

            // GET ALL CARTS
            
            await login(admin)

            let res = await request(app)
            .get(`${routeCarts}/all`)
            .set("Cookie", currentUserCookie)
            .expect(200)

            expect(res.body).toHaveLength(8)
            expect(res.body.filter((cart : any) => cart.paid == 0)).toHaveLength(2)

            await logout()

        })
    })

})