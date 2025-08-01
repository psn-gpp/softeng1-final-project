import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category } from "../src/components/product"
import dayjs from "dayjs"

const routePath = "/ezelectronics" //Base route path for the API

const product = { sellingPrice: 1000, model: "model", category: Category.SMARTPHONE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 10 }
const product2 = { sellingPrice: 2000, model: "model2", category: Category.SMARTPHONE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 20 }
const product3 = { sellingPrice: 3000, model: "model3", category: Category.APPLIANCE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 30 }
const product4 = { sellingPrice: 4000, model: "model4", category: Category.APPLIANCE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 40 }
const product5 = { sellingPrice: 5000, model: "model5", category: Category.LAPTOP, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 50 }
const product6 = { sellingPrice: 6000, model: "model6", category: Category.LAPTOP, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 60 }


const noModelProduct = { sellingPrice: 1000, model: "", category: Category.SMARTPHONE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 10 }
const deletedProduct = { sellingPrice: 1000, model: "deletedProductModel", category: Category.SMARTPHONE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 10 }
const unavaiableProduct = { sellingPrice: 1000, model: "unavaiableModel", category: Category.APPLIANCE, details: "details", quantity: 5 }
const wrongFormatDateProduct = { sellingPrice: 99.99, model: "wrongDateModel", category: Category.APPLIANCE, arrivalDate: dayjs().format("DD-MM-YYYY"), details: "Test details", quantity: 10 }

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string

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
    await postUser(customer)
})

beforeEach(async () => {
    adminCookie = await login(admin)
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})


describe('Product Integration Tests routes + dao + db', () => {

    describe("POST /products", () => {

        describe("Successfully add a new product", () => {

            test('Create a product', async () => {
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(product)
                    .expect(200)
    
                expect(response.body).toEqual({})
            })
    
            test('Insert every product*', async () => {
                const response2 = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(product2)
                    .expect(200)
    
                expect(response2.body).toEqual({})
    
                const response3 = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(product3)
                    .expect(200)
    
                expect(response3.body).toEqual({})
    
                const response4 = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(product4)
                    .expect(200)
    
                expect(response4.body).toEqual({})
    
                const response5 = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(product5)
                    .expect(200)
    
                expect(response5.body).toEqual({})
    
                const response6 = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(product6)
                    .expect(200)
                
                expect(response6.body).toEqual({})

                // This product will be unavaiable
                const responseu = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(unavaiableProduct)
                    .expect(200)
    
                expect(responseu.body).toEqual({})
            })
        })

        describe("Errors for model", () => {

            test('Create a product without model', async () => {
                     const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(noModelProduct)
                    .expect(422)
    
            })
        })
        describe("Errors for category", () => {

            test('Create a product with wrong category', async () => {
                const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **category** - Reason: *Invalid value* - Location: *body*\n\n"
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send({ sellingPrice: 99.99, model: "model", category: "wrongCategory", arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 10 })
                    .expect(422)
    
                expect(response.body).toEqual({error: errorMessage})
            })
        })
        describe("Errors for quantity", () => {

            test('Create a product with negative quantity', async () => {
                const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **quantity** - Reason: *Invalid value* - Location: *body*\n\n"
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send({ sellingPrice: 99.99, model: "model", category: Category.SMARTPHONE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: -10 })
                    .expect(422)
    
                expect(response.body).toEqual({error: errorMessage})
            })
        })

        describe("Errors for sellingPrice", () => {

            test('Create a product with missing sellingPrice', async () => {
                const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **sellingPrice** - Reason: *Invalid value* - Location: *body*\n\n"
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send({ model: "model", category: Category.SMARTPHONE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 10 })
                    .expect(422)
    
                expect(response.body).toEqual({error: errorMessage})
            })

            test('Create a product with negative price', async () => {

                const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **sellingPrice** - Reason: *Invalid value* - Location: *body*\n\n"
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send({ sellingPrice: -99.99, model: "model", category: Category.SMARTPHONE, arrivalDate: dayjs().format("YYYY-MM-DD"), details: "details", quantity: 10 })
                    .expect(422)
    
                expect(response.body).toEqual({error: errorMessage})
            })
        })

        describe("Errors for arrivalDate", () => {

            test('Create a product with wrong date format', async () => {
                const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **arrivalDate** - Reason: *Invalid value* - Location: *body*\n\n"
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send(wrongFormatDateProduct)
                    .expect(422)
    
                expect(response.body).toEqual({error: errorMessage})
            })

            test('Create a product with tomorrow date', async () => {
                const errorMessage = "New date cannot be after current date or before arrival date of the product"
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', adminCookie)
                    .send({ sellingPrice: 99.99, model: "model", category: Category.SMARTPHONE, arrivalDate: dayjs().add(1, 'day').format("YYYY-MM-DD"), details: "details", quantity: 10 })
                    .expect(400)
    
                expect(response.body).toEqual({error: errorMessage, status: 400})
            })
    
        })
        describe("Errors for authentication", () => {

            test('Create a product without being logged in', async () => {
                const errorMessage = "Unauthenticated user"
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .send(product)
                    .expect(401)
    
                expect(response.body).toEqual({error: errorMessage, status: 401})
            })
            
            test('Create a product with a customer account', async () => {
                const errorMessage = "User is not an admin or manager"
    
                customerCookie = await login(customer)
    
                const response = await request(app)
                    .post(`${routePath}/products`)
                    .set('Cookie', customerCookie)
                    .send(product)
                    .expect(401)
    
                expect(response.body).toEqual({error: errorMessage, status: 401})
            })
        })
    })

    describe("PATCH /products/:model", () => {

        test('Update a product quantity', async () => {
            const newQuantity = 10;
            const changeDate = dayjs().format("YYYY-MM-DD");
            
            const response = await request(app)
                .patch(`${routePath}/products/${product.model}`)
                .set('Cookie', adminCookie)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(200)
    
            expect(response.body).toEqual({quantity: 20})
        })

        test('Update a product quantity with a non existing product', async () => {
            const newQuantity = 10;
            const changeDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "Product not found"

            const response = await request(app)
                .patch(`${routePath}/products/nonExistingModel`)
                .set('Cookie', adminCookie)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(404)
    
            expect(response.body).toEqual({error: errorMessage, status: 404})
        
        })

        test('Update a product quantity with wrong date format', async () => {
            const newQuantity = 10;
            const changeDate = dayjs().format("DD-MM-YYYY");
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **changeDate** - Reason: *Invalid value* - Location: *body*\n\n"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}`)
                .set('Cookie', adminCookie)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(422)
    
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Update a product quantity with a negative quantity', async () => {
            const newQuantity = -10;
            const changeDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **quantity** - Reason: *Invalid value* - Location: *body*\n\n"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}`)
                .set('Cookie', adminCookie)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(422)
    
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Update a product quantity with a wrong date', async () => {
            const newQuantity = 10;
            const changeDate = dayjs().add(1, 'day').format("YYYY-MM-DD");
            const errorMessage = "New date cannot be after current date or before arrival date of the product"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}`)
                .set('Cookie', adminCookie)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(400)
    
            expect(response.body).toEqual({error: errorMessage, status: 400})
        })

        test('Update a product quantity with a null date', async () => {
            const newQuantity = 5;

            const response = await request(app)
                .patch(`${routePath}/products/${product6.model}`)
                .set('Cookie', adminCookie)
                .send({ quantity: newQuantity })
                .expect(200)
    
            expect(response.body).toEqual({quantity: 65})
        })

        test('Update a product quantity without being logged in', async () => {
            const newQuantity = 10;
            const changeDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "Unauthenticated user"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}`)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

        test('Update a product quantity with a customer account', async () => {
            const newQuantity = 10;
            const changeDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "User is not an admin or manager"

            customerCookie = await login(customer)

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}`)
                .set('Cookie', customerCookie)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

        test('Update a product quantity with yesterday date', async () => {
            const newQuantity = 10;
            const changeDate = dayjs().subtract(1, 'day').format("YYYY-MM-DD");
            const errorMessage = "New date cannot be after current date or before arrival date of the product"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}`)
                .set('Cookie', adminCookie)
                .send({ quantity: newQuantity, changeDate: changeDate })
                .expect(400)
    
            expect(response.body).toEqual({error: errorMessage, status: 400})
        })
        
    })

    describe("PATCH /products/:model/sell", () => {

        test('Sell a product and update quantity', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().format("YYYY-MM-DD");
    
            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(200)
    
            expect(response.body).toEqual({quantity: 15})
        })

        test('Sell a product and update quantity to make that product unavaiable', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().format("YYYY-MM-DD");
    
            const response = await request(app)
                .patch(`${routePath}/products/${unavaiableProduct.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:unavaiableProduct.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(200)
    
            expect(response.body).toEqual({quantity: 0})
        })

        test('Sell a product with a null date', async () => {
            const quantityToSell = 5;

            const response = await request(app)
                .patch(`${routePath}/products/${product6.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:product6.model, quantity: quantityToSell })
                .expect(200)
    
            expect(response.body).toEqual({quantity: 60})
        })

        test('Sell a product with a non existing product', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "Product not found"

            const response = await request(app)
                .patch(`${routePath}/products/nonExistingModel/sell`)
                .set('Cookie', adminCookie)
                .send({ model:"nonExistingModel", quantity: quantityToSell, sellingDate: sellingDate })
                .expect(404)
    
            expect(response.body).toEqual({error: errorMessage, status: 404})
        })

        test('Sell a product with wrong date format', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().format("DD-MM-YYYY");
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **sellingDate** - Reason: *Invalid value* - Location: *body*\n\n"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(422)
    
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Sell a product with a negative quantity', async () => {
            const quantityToSell = -5;
            const sellingDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **quantity** - Reason: *Invalid value* - Location: *body*\n\n"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(422)
    
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Sell a product with a wrong date', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().add(1, 'day').format("YYYY-MM-DD");
            const errorMessage = "New date cannot be after current date or before arrival date of the product"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(400)
    
            expect(response.body).toEqual({error: errorMessage, status: 400})
        })

        test('Sell a product with yesterday date', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().subtract(1, 'day').format("YYYY-MM-DD");
            const errorMessage = "New date cannot be after current date or before arrival date of the product"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(400)
    
            expect(response.body).toEqual({error: errorMessage, status: 400})
        })

        test('Sell a product with a quantity greater than the available quantity', async () => {
            const quantityToSell = 20;
            const sellingDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "Product stock cannot satisfy the requested quantity"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(409)
    
            expect(response.body).toEqual({error: errorMessage, status: 409})
        })

        test('Sell a product with quantity equal to 0', async () => {
            const quantityToSell = 10;
            const sellingDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "Product stock is empty"

            const response = await request(app)
                .patch(`${routePath}/products/${unavaiableProduct.model}/sell`)
                .set('Cookie', adminCookie)
                .send({ model:unavaiableProduct.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(409)
    
            expect(response.body).toEqual({error: errorMessage, status: 409})
        })

        test('Sell a product without being logged in', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "Unauthenticated user"

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

        test('Sell a product with a customer account', async () => {
            const quantityToSell = 5;
            const sellingDate = dayjs().format("YYYY-MM-DD");
            const errorMessage = "User is not an admin or manager"

            customerCookie = await login(customer)

            const response = await request(app)
                .patch(`${routePath}/products/${product.model}/sell`)
                .set('Cookie', customerCookie)
                .send({ model:product.model, quantity: quantityToSell, sellingDate: sellingDate })
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

    })


    describe("GET /products/available", () => {

        test('Get all available products', async () => {
            const response = await request(app)
                .get(`${routePath}/products/available`)
                .set('Cookie', adminCookie)
                .expect(200)
        
            expect(response.body).toEqual([
                {...product, quantity: 15},
                {...product2, quantity: 20},
                {...product3, quantity: 30},
                {...product4, quantity: 40},
                {...product5, quantity: 50},
                {...product6, quantity: 60},
            ])
        })
        
        test('Get all available products with category grouping and category', async () => {
            const testGrouping = "category";
            const testCategory = Category.SMARTPHONE;            
        
            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&category=${testCategory}`)
                .set('Cookie', adminCookie)
                .expect(200)
        
            expect(response.body).toEqual([
                { ...product, quantity: 15 },
                { ...product2, quantity: 20 },
            ].filter(product => product.category === testCategory));
        })
        
        test('Get all available products with model grouping and model', async () => {
            const testGrouping = "model";
            const testModel = product.model;          
        
            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(200)
        
            expect(response.body).toEqual([{...product, quantity: 15}])
        })

        test('Get all available products with a model that does not exist', async () => {
            const testGrouping = "model";
            const testModel = "nonExistingModel";
            const errorMessage = "Product not found"

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(404)
        
                expect(response.body).toEqual({error: errorMessage, status: 404})
        })

        test('Get all available products with model that is "" ', async () => {
            const testGrouping = "model";
            const testModel = "";          
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all available products with a wrong grouping', async () => {
            const testGrouping = "wrongGrouping";
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **grouping** - Reason: *Invalid value* - Location: *query*\n\n";
        
            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage})
        })
        
        test('Get all available products with a wrong category', async () => {
            const testGrouping = "category";
            const testCategory = "nonExistingCategory";
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **category** - Reason: *Invalid value* - Location: *query*\n\n";

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&category=${testCategory}`)
                .set('Cookie', adminCookie)
                .expect(422)
         
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Get all available products with model grouping and category', async () => {
            const testGrouping = "model";
            const testCategory = Category.SMARTPHONE;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&category=${testCategory}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all available products with category grouping and model', async () => {
            const testGrouping = "category";
            const testModel = product.model;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all available products with category grouping and null category', async () => {
            const testGrouping = "category";
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **category** - Reason: *Invalid value* - Location: *query*\n\n";

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&category=${null}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Get all available products with model grouping and null model', async () => {
            const testGrouping = "model";
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all available products with grouping, category and model', async () => {
            const testGrouping = "model";
            const testCategory = Category.SMARTPHONE;
            const testModel = product.model;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&category=${testCategory}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all available products with null grouping, but with category', async () => {
            const testCategory = Category.SMARTPHONE;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products/available?category=${testCategory}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })
        
        test('Get all available products without being logged in', async () => {
            const testGrouping = "category";
            const testCategory = Category.SMARTPHONE;
            const errorMessage = "Unauthenticated user"
        
            const response = await request(app)
                .get(`${routePath}/products/available?grouping=${testGrouping}&category=${testCategory}`)
                .expect(401)
        
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

    })

    describe("GET /products", () => {

        test('Get all products', async () => {
            const response = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .expect(200)
    
            expect(response.body).toEqual([
                {...product, quantity: 15},
                {...product2, quantity: 20},
                {...product3, quantity: 30},
                {...product4, quantity: 40},
                {...product5, quantity: 50},
                {...product6, quantity: 60},
                { ...unavaiableProduct, quantity: 0, arrivalDate: dayjs().format("YYYY-MM-DD") }
            ])
        })

        test('Get all products with category grouping and category', async () => {
            const testGrouping = "category";
            const testCategory = Category.SMARTPHONE;            
        
            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&category=${testCategory}`)
                .set('Cookie', adminCookie)
                .expect(200)
        
            expect(response.body).toEqual([
                { ...product, quantity: 15 },
                { ...product2, quantity: 20 },
            ].filter(product => product.category === testCategory));
        })
        
        test('Get all products with model grouping and model', async () => {
            const testGrouping = "model";
            const testModel = product.model;          
        
            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(200)
        
            expect(response.body).toEqual([{...product, quantity: 15}])
        })

        test('Get all products with a model that does not exist', async () => {
            const testGrouping = "model";
            const testModel = "nonExistingModel";
            const errorMessage = "Product not found"

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(404)
        
            expect(response.body).toEqual({error: errorMessage, status: 404})
        })

        test('Get all products with model that is "" ', async () => {
            const testGrouping = "model";
            const testModel = "";          
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.status).toEqual(422)
        })

        test('Get all products with a wrong grouping', async () => {
            const testGrouping = "wrongGrouping";
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **grouping** - Reason: *Invalid value* - Location: *query*\n\n";
        
            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Get all products with a wrong category', async () => {
            const testGrouping = "category";
            const testCategory = "nonExistingCategory";
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **category** - Reason: *Invalid value* - Location: *query*\n\n";

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&category=${testCategory}`)
                .set('Cookie', adminCookie)
                .expect(422)
         
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Get all products with model grouping and category', async () => {
            const testGrouping = "model";
            const testCategory = Category.SMARTPHONE;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&category=${testCategory}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all products with category grouping and model', async () => {
            const testGrouping = "category";
            const testModel = product.model;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all products with category grouping and null category', async () => {
            const testGrouping = "category";
            const errorMessage = "The parameters are not formatted properly\n\n- Parameter: **category** - Reason: *Invalid value* - Location: *query*\n\n";

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&category=${null}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage})
        })

        test('Get all products with model grouping and null model', async () => {
            const testGrouping = "model";
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}`)
                .set('Cookie', adminCookie)
                .expect(422)
        
            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all products with grouping, category and model', async () => {
            const testGrouping = "model";
            const testCategory = Category.SMARTPHONE;
            const testModel = product.model;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&category=${testCategory}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(422)

            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all products with null grouping, but with category and model', async () => {
            const testCategory = Category.SMARTPHONE;
            const testModel = product.model;
            const errorMessage = "Error trying to retrieve products array";

            const response = await request(app)
                .get(`${routePath}/products?category=${testCategory}&model=${testModel}`)
                .set('Cookie', adminCookie)
                .expect(422)

            expect(response.body).toEqual({error: errorMessage, status: 422})
        })

        test('Get all products without being logged in', async () => {
            const testGrouping = "category";
            const testCategory = Category.SMARTPHONE;
            const errorMessage = "Unauthenticated user"
        
            const response = await request(app)
                .get(`${routePath}/products?grouping=${testGrouping}&category=${testCategory}`)
                .expect(401)
        
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })
    })

    describe("DELETE /products", () => {

        test('Delete all products', async () => {
            const response = await request(app)
                .delete(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .expect(200)
            expect(response.body).toEqual({})
    
            const products = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .expect(200)
    
            expect(products.body).toEqual([])
        })

        test('Delete all products without being logged in', async () => {
            const errorMessage = "Unauthenticated user"

            const response = await request(app)
                .delete(`${routePath}/products`)
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

        test('Delete all products with a customer account', async () => {
            const errorMessage = "User is not an admin or manager"

            customerCookie = await login(customer)

            const response = await request(app)
                .delete(`${routePath}/products`)
                .set('Cookie', customerCookie)
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

        
        test('Delete product by model', async () => {
            const response = await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .send(deletedProduct)
                .expect(200)
            expect(response.body).toEqual({})
    
            const response2 = await request(app)
                .delete(`${routePath}/products/${deletedProduct.model}`)
                .set('Cookie', adminCookie)
                .expect(200)
    
            expect(response2.body).toEqual({})
    
            const products = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .expect(200)
    
            expect(products.body).toEqual([])
        })

        test('Delete product by model without being logged in', async () => {
            const errorMessage = "Unauthenticated user"

            const response = await request(app)
                .delete(`${routePath}/products/${deletedProduct.model}`)
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

        test('Delete product by model with a customer account', async () => {
            const errorMessage = "User is not an admin or manager"

            customerCookie = await login(customer)

            const response = await request(app)
                .delete(`${routePath}/products/${deletedProduct.model}`)
                .set('Cookie', customerCookie)
                .expect(401)
    
            expect(response.body).toEqual({error: errorMessage, status: 401})
        })

        test('Delete product by model with a non existing product', async () => {
            const errorMessage = "Product not found"

            const response = await request(app)
                .delete(`${routePath}/products/nonExistingModel`)
                .set('Cookie', adminCookie)
                .expect(404)
    
            expect(response.body).toEqual({error: errorMessage, status: 404})
        })
    })

})