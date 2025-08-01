import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";
import dayjs from "dayjs";
import { Role } from "../src/components/user"; // Assuming Role is defined here

const routePath = "/ezelectronics"; // Base route path for the API

// Default user information. We use them to create reviews and evaluate the returned values
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
const manager={username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager"}
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
const customer2= { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer"}
const customer3={username: "customer3", name: "customer3", surname: "customer3", password: "customer3", role: "Customer"}
const inputCustomerUser = { username: "customer", name: "customer", surname: "customer", role: Role.CUSTOMER, address: 'address', birthdate: dayjs().format('YYYY-MM-DD') };
const inputReview = { score: 5, comment: "Great product!" };
const inputProduct = { model: "iPhone 13", category: "Smartphone", quantity: 5, details: "details", sellingPrice: 200, arrivalDate: "2024-01-01" };
const inputProduct2 = { model: "iPhone 14", category: "Smartphone", quantity: 2, details: "details", sellingPrice: 300, arrivalDate: "2024-05-01" };
const inputReview2 = { score: 4, comment: "bad product!" };

// Cookies for the reviews. We use them to keep reviews logged in. Creating them once and saving them in variables outside of the tests will make cookies reusable
let customerCookie: string;
let adminCookie: string;
let customerCookie2: string
let customerCookie3: string
let managerCookie: string


// Helper function that creates a new user in the database.
// Can be used to create a user before the tests or in the tests
// Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
};

// Helper function that creates a new product model in the database.
// Can be used to create a product model before the tests or in the tests
const postProductModel = async (productInfo: any, authCookie: string) => {
    await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", authCookie) // Set the authentication cookie
        .send(productInfo) 
        .expect(200);
};

// Helper function that logs in a user and returns the cookie
// Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
};

// Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup();
    await postUser(admin);
    adminCookie = await login(admin); // Admin logged in before every test
    await postUser(customer);
    customerCookie = await login(customer); // Customer logged in before every test
    await postProductModel(inputProduct, adminCookie); // Create the product model using admin
    //await postProductModel(inputProduct2, adminCookie); // Create the product model using admin

});

// After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup();
});

describe("Reviews routes integration tests", () => {
    describe("POST /reviews/:model", () => {
        test("it should return a 200 success code when customer inserts a review", async () => {
            const mockModel = 'iPhone 13'; // Example model

            await request(app)
                .post(`${routePath}/reviews/${mockModel}`)
                .set("Cookie", customerCookie) // Set the authentication cookie
                .send(inputReview) // We send a review
                .expect(200);

            const reviews = await request(app)
                .get(`${routePath}/reviews/${mockModel}`)
                .set("Cookie", customerCookie) // Set the authentication cookie
                .expect(200);

            // Expectation from reviews.body
            expect(reviews.body).toHaveLength(1);
            let rev = reviews.body.find((review: any) => review.model === mockModel);
            expect(rev).toBeDefined();
            expect(rev.model).toBe(mockModel);
            expect(rev.user).toBe(inputCustomerUser.username); // Check username instead of whole user object
            expect(rev.score).toBe(inputReview.score);
            expect(rev.comment).toBe(inputReview.comment);
        });

        test("it should return 200 success code " , async () => {
            await postUser(customer2) ;
            customerCookie2 = await login(customer2);//logging in another user that will do a review also on iphone 13

            const mockModel = 'iPhone 13';
            await request(app)
            .post(`${routePath}/reviews/${mockModel}`)
            .set("Cookie", customerCookie2) // Set the authentication cookie
            .send(inputReview2) // We send a review // now we have 2 reviews for iphone 13
            .expect(200) ;

            const reviews = await request(app)
            .get(`${routePath}/reviews/${mockModel}`)
            .set("Cookie", customerCookie) // Set the authentication cookie
            .expect(200);

        // Expectation from reviews.body
        expect(reviews.body).toHaveLength(2);
        let rev = reviews.body.find((review: any) => review.model === mockModel);
        expect(rev).toBeDefined();
        expect(rev.model).toBe(mockModel);
        expect(rev.user).toBe(inputCustomerUser.username); // Check username instead of whole user object
        expect(rev.score).toBe(inputReview.score);
        expect(rev.comment).toBe(inputReview.comment);

        })

        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            const mockModel = 'iPhone 13';

            await request(app)
                .post(`${routePath}/reviews/${mockModel}`)
                .set("Cookie", customerCookie) // Set the authentication cookie
                .send({ score: 6, comment: "good" }) // Invalid score
                .expect(422);

            await request(app)
                .post(`${routePath}/reviews/${mockModel}`)
                .set("Cookie", customerCookie) // Set the authentication cookie
                .send({ score: 5, comment: undefined }) // Missing comment
                .expect(422);

            await request(app)
                .post(`${routePath}/reviews/${mockModel}`)
                .set("Cookie", customerCookie) // Set the authentication cookie
                .send({ score: undefined, comment: "good" }) // Missing score
                .expect(422);

            // invalid model in the route
            await request(app)
                .post(`${routePath}/reviews/invalid`)
                .set("Cookie", customerCookie) // Set the authentication cookie
                .expect(422);
        });

        test("it should return a 401 error code if user is not a customer", async () => {
            await request(app)
                .post(`${routePath}/reviews/iPhone 13`)
                .set("Cookie", adminCookie) // Set the authentication cookie
                .expect(401);
        });

        // It should return a 409 error when the review already exists for the same user and product model
        test("It should return a 409 error code if the review already exists for the same user and product model", async () => {
            const mockModel = 'iPhone 13';

            // shouldn't succeed because already present
            await request(app)
                .post(`${routePath}/reviews/${mockModel}`)
                .set("Cookie", customerCookie) // Set the authentication cookie
                .send(inputReview) // We send a review
                .expect(409);

            
        });

        // returning 404 if model not found ---->> not working returning always 422 even if it works for any other route
      test("it should return 404 error code if model not found", async () => {
            const mockModel = 'invalid';
            await request(app)
            .post(`${routePath}/reviews/${mockModel}`).send(inputReview)
            .set("Cookie",customerCookie) // Set the authentication cookie
            .expect(404);
        })


        // it should return 404 error if model is empty string
       test("should return 404 error code if model is empty string", async () => {
        const mockModel = '';
        await request(app)
        .post(`${routePath}/reviews/${mockModel}`).send(inputReview)
        .set("Cookie",adminCookie) // Set the authentication cookie
        .expect(404);
       })
        
    });



    describe("GET /reviews/:model", () => {
        test("it should return a 200 success code when customer gets reviews", async () => {
            const mockModel = 'iPhone 13';
            const reviews = await request(app)
            .get(`${routePath}/reviews/${mockModel}`)
            .set("Cookie",adminCookie) // Set the authentication cookie
            .expect(200);

        // Expectation from reviews.body
        expect(reviews.body).toHaveLength(2);
        let rev = reviews.body.find((review: any) => review.model === mockModel);
        
        expect(rev).toBeDefined();
        expect(rev.model).toBe(mockModel);
        expect(rev.user).toBe(inputCustomerUser.username); // Check username instead of whole user object
        expect(rev.score).toBe(inputReview.score);
        expect(rev.comment).toBe(inputReview.comment);
        })





        // it should return 404 error if model is empty string
        test("should return 404 error code if model is empty string", async () => {
        const mockModel = '';
        await request(app)
        .get(`${routePath}/reviews/${mockModel}`)
        .set("Cookie",adminCookie) // Set the authentication cookie
        .expect(404);
       })

       // 401 error if user not logged in
       test("should return 401 error code if user not logged in", async () => {
        const mockModel = 'iPhone 13';
        await request(app)
        .get(`${routePath}/reviews/${mockModel}`)
        .expect(401);
       })
    
    
    })

    describe("DELETE /reviews/:model", () => {
        test("it should delete a model and return 200 success code", async () => {
            const mockModel = 'iPhone 13';
            await request(app)
            .delete(`${routePath}/reviews/${mockModel}`)
            .set("Cookie",customerCookie) // Set the authentication cookie
            .expect(200);
        })


        test("it should return 401 error code if user not customer", async () => {
            const mockModel = 'iPhone 13';
            await request(app)
            .delete(`${routePath}/reviews/${mockModel}`)
            .set("Cookie",adminCookie) // Set the authentication cookie
            .expect(401);
        })

        

        test("it should return 404 error code if model not found", async () => {
            const mockModel = 'invalid';
            await request(app)
            .delete(`${routePath}/reviews/${mockModel}`)
            .set("Cookie",customerCookie) // Set the authentication cookie
            .expect(404);
        })


        test("it should return 404 error code if customer logged in has no reviews to delete", async () => {
            await postUser(customer3) ;
            customerCookie3 = await login(customer3); // customer 2 logged in
            await request(app)
            .delete(`${routePath}/reviews/iPhone 13`)
            .set("Cookie",customerCookie3) // Set the authentication cookie
            .expect(404);
            
        })
    })



    describe("DELETE /reviews/:model/all", () => {
        test("it should return a 200 success code and reviews of a product are deleted if user is admin", async () =>{
            const mockModel = 'iPhone 13';
            await request(app)
            .delete(`${routePath}/reviews/${mockModel}/all`)
            .set("Cookie",adminCookie) // Set the authentication cookie
            .expect(200);
        } )

        test("it should return a 200 success code and reviews of a product are deleted if user is manager", async () =>{
            await postUser(manager)
            managerCookie = await login(manager);
            const mockModel = 'iPhone 13';
            await request(app)
            .delete(`${routePath}/reviews/${mockModel}/all`)
            .set("Cookie",managerCookie) // Set the authentication cookie
            .expect(200);
        })


        test( "it should return an 401 error code if user not an admin or manager", async () =>{
            const mockModel = 'iPhone 13';
            await request(app)
            .delete(`${routePath}/reviews/${mockModel}/all`)
            .set("Cookie",customerCookie) // Set the authentication cookie
            .expect(401);
        })

        test("it should return an 404 error code if model does not exist", async () =>{
            const mockModel = 'invalid';
            await request(app)
            .delete(`${routePath}/reviews/${mockModel}/all`)
            .set("Cookie",adminCookie) // Set the authentication cookie
            .expect(404);
        })


    })


    describe("DELETE /reviews", () => {

        test("it should return a 200 success code and reviews of a product are deleted if user is manager", async () =>{
            const mockModel = 'iPhone 13';
            await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie",managerCookie) // Set the authentication cookie
            .expect(200);
        })

        test("it should delete all reviews and return 200 success code if admin", async() => {
            const mockModel = 'iPhone 13';
            await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie",adminCookie) // Set the authentication cookie
            .expect(200);

        })

       
       
        test("it should return 401 error code if user not admin or manager", async() => {
            await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie",customerCookie) // Set the authentication cookie
            .expect(401);
        })
    })






});
