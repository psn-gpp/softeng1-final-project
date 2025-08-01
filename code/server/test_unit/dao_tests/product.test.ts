import { afterEach, describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import ProductDAO from "../../src/dao/productDAO"
import dayjs from "dayjs"
import { Product, Category } from "../../src/components/product"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError,ArrivalDateError, GetProductsError } from "../../src/errors/productError"
import db from "../../src/db/db"
import { Database } from "sqlite3"


jest.mock("../../src/db/db.ts")

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});



describe("Product DAO unit tests", () => {

    describe("Register products arrival", () => {

        test("should resolve successfully when registering a new product", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.registerProducts("newModel", "category", 10, "details", 100, dayjs().format('YYYY-MM-DD')))
                .resolves.toBeUndefined();
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        });

        test("should resolve successfully when registering a new product without a date and details", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.registerProducts("newModel", "category", 10, null, 100, null))
                .resolves.toBeUndefined();
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        });
        
        test("should reject with ProductAlreadyExistsError if product model already exists", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "existingModel" });
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.registerProducts("existingModel", "category", 10, "details", 100, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow(ProductAlreadyExistsError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
        
        });
        
        test("should reject with an error if there is a database operation error", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"));
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.registerProducts("newModel", "category", 10, "details", 100, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Database error");
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        });

        test("should reject with an error if an exception is thrown", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw new Error("Unexpected error");
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.registerProducts("newModel", "category", 10, "details", 100, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Unexpected error");
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore();
        });
    })

    describe("Change product quantity", () => {

        test("should reject with ProductNotFoundError if product does not exist", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.changeProductQuantity("nonExistingModel", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow(ProductNotFoundError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore()
        });
        
        test("should reject with an error if there is a database operation error during selection", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"), null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.changeProductQuantity("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Database error");
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore()
        });
        
        test("should reject with ArrivalDateError if new changeDate is before the product's arrivalDate", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", arrivalDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), quantity: 10 });
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.changeProductQuantity("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow(ArrivalDateError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore()
        });
        
        test("should reject with an error if there is a database operation error during update", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", arrivalDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), quantity: 10 });
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"));
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.changeProductQuantity("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Database error");
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        });
        
        test("should resolve successfully and return the new quantity when update is successful", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", arrivalDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), quantity: 10 });
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            const newQuantity = await productDAO.changeProductQuantity("model", 5, dayjs().format('YYYY-MM-DD'));
        
            expect(newQuantity).toBe(15);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        });

        test("should reject with an error if an exception occurs in changeProductQuantity", async () => {
            const productDAO = new ProductDAO();
        
            const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
                throw new Error("Unexpected error");
            });
        
            await expect(productDAO.changeProductQuantity("model", 10, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Unexpected error");
        
            mockDBGet.mockRestore();
        });
    })

    describe("Sell product", () => {

        test("should reject with ProductNotFoundError if product does not exist", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.sellProduct("nonExistingModel", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow(ProductNotFoundError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
        });
        
        test("should reject with an error if there is a database operation error during selection", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"), null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.sellProduct("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Database error");
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
        });
        
        test("should reject with EmptyProductStockError if product stock is empty", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", quantity: 0, arrivalDate: dayjs().format('YYYY-MM-DD') });
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.sellProduct("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow(EmptyProductStockError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
        });
        
        test("should reject with ArrivalDateError if sellingDate is before the product's arrivalDate", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", quantity: 10, arrivalDate: dayjs().add(1, 'day').format('YYYY-MM-DD') });
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.sellProduct("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow(ArrivalDateError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
        });
        
        test("should reject with LowProductStockError if stock is insufficient", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", quantity: 3, arrivalDate: dayjs().format('YYYY-MM-DD') });
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.sellProduct("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow(LowProductStockError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
        });
        
        test("should reject with an error if there is a database operation error during update", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", quantity: 10, arrivalDate: dayjs().format('YYYY-MM-DD') });
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"));
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.sellProduct("model", 5, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Database error");
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        });
        
        test("should resolve successfully and return the new quantity when selling is successful", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model", quantity: 10, arrivalDate: dayjs().format('YYYY-MM-DD') });
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            const newQuantity = await productDAO.sellProduct("model", 5, dayjs().format('YYYY-MM-DD'));
        
            expect(newQuantity).toBe(5);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        });

        test("should reject with an error if an exception occurs in sellProduct", async () => {
            const productDAO = new ProductDAO();
        
            const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
                throw new Error("Unexpected error");
            });
        
            await expect(productDAO.sellProduct("model", 10, dayjs().format('YYYY-MM-DD')))
                .rejects.toThrow("Unexpected error");
        
            mockDBGet.mockRestore();
        });
        
    })

    describe("Get ALL products", () => {
        
        test("should reject with an error if there is a database operation error", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                callback(new Error("Database error"), null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.getAllProducts())
                .rejects.toThrow("Database error");
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            mockDBAll.mockRestore()
        });
        
        test("should resolve with an array of products if the query is successful", async () => {
            const productsFromDB = [
                { sellingPrice: 100, model: "model1", category: Category.SMARTPHONE, arrivalDate: "2023-01-01", details: "details1", quantity: 10 },
                { sellingPrice: 200, model: "model2", category: Category.LAPTOP, arrivalDate: "2023-02-01", details: "details2", quantity: 20 },
            ];
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                callback(null, productsFromDB);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            const products = await productDAO.getAllProducts();
        
            expect(products).toEqual(productsFromDB.map(product => new Product(product.sellingPrice, product.model, product.category, product.arrivalDate, product.details, product.quantity)));
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            mockDBAll.mockRestore()
        });

        test("should reject with an error if an exception occurs in getAllProducts", async () => {
            const productDAO = new ProductDAO();
        
            jest.spyOn(db, "all").mockImplementation(() => {
                throw new Error("Unexpected error");
            });
        
            await expect(productDAO.getAllProducts())
                .rejects.toThrow("Unexpected error");
        });
    })


    describe("Get products by category", () => {

        test("should reject with an error if there is a database operation error", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"), null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.getProductsByCategory(Category.APPLIANCE))
                .rejects.toThrow("Database error");
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            mockDBAll.mockRestore()
        });
        
        test("should resolve with an array of products if the query is successful", async () => {
            const productsFromDB = [
                { sellingPrice: 100, model: "model1", category: Category.APPLIANCE, arrivalDate: "2023-01-01", details: "details1", quantity: 10 },
                { sellingPrice: 200, model: "model2", category: Category.APPLIANCE, arrivalDate: "2023-02-01", details: "details2", quantity: 20 },
            ];
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, productsFromDB);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            const products = await productDAO.getProductsByCategory(Category.APPLIANCE);
        
            expect(products).toEqual(productsFromDB.map(product => new Product(product.sellingPrice, product.model, product.category, product.arrivalDate, product.details, product.quantity)));
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            mockDBAll.mockRestore()
        });
        
        test("should reject without error if the category is invalid", async () => {
            const productDAO = new ProductDAO();
            await expect(productDAO.getProductsByCategory("InvalidCategory"))
                .rejects.toBeUndefined();
        });

        test("should reject with an error if an exception occurs in getProductsByCategory", async () => {
            const productDAO = new ProductDAO();
        
            jest.spyOn(db, "all").mockImplementation(() => {
                throw new Error("Unexpected error");
            });
        
            await expect(productDAO.getProductsByCategory(Category.APPLIANCE))
                .rejects.toThrow("Unexpected error");
        });
    })

    describe("Get product by model", () => {

        test("should reject with an error if there is a database operation error", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"), null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.getProductByModel("model"))
                .rejects.toThrow("Database error");
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            mockDBAll.mockRestore()
        
        });
        
        test("should resolve with an array containing the product if the query is successful", async () => {
            const productFromDB = {
                sellingPrice: 100, model: "model", category: Category.APPLIANCE, arrivalDate: "2023-01-01", details: "details", quantity: 10
            };
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [productFromDB]);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            const products = await productDAO.getProductByModel("model");
        
            expect(products).toEqual([new Product(productFromDB.sellingPrice, productFromDB.model, productFromDB.category, productFromDB.arrivalDate, productFromDB.details, productFromDB.quantity)]);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            mockDBAll.mockRestore()
        
        });
        
        test("should reject with ProductNotFoundError if the product does not exist", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.getProductByModel("nonExistingModel")).rejects.toThrow(ProductNotFoundError);
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            mockDBAll.mockRestore()
        
        });

        test('should reject with an error if unable to connect to the database', async () => {
            const productDAO = new ProductDAO();
        
            const mockDBGet = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(new Error('Unable to connect to the database'), null);
                return {} as Database;
            });
        
            await expect(productDAO.getProductByModel("nonExistingModel")).rejects.toThrow('Unable to connect to the database');
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore();
        });

        test('should reject with an error if unable to connect to the database', async () => {
            const productDAO = new ProductDAO();
        
            const mockDBGet = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                throw new Error('Unable to connect to the database');
            });
        
            const rejectMock = jest.fn();
        
            try {
                await productDAO.getProductByModel("nonExistingModel");
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Unable to connect to the database');
                rejectMock(error);
            }
        
            expect(rejectMock).toHaveBeenCalled();
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore();
        });
    })

    describe("Delete products (one or ALL)", () => {

        test("should delete all products and resolve with true", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const productDAO = new ProductDAO();
            const result = await productDAO.deleteProduct(null);
        
            expect(result).toBe(true);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
            mockDBRun.mockRestore()
        
        });
        
        test("should delete product for a valid model and resolve with true", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { model: "model" });
                return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            const result = await productDAO.deleteProduct("model");
        
            expect(result).toBe(true);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        
        });
        
        test("should reject with ProductNotFoundError if model does not exist", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.deleteProduct("nonExistingModel"))
                .rejects.toThrow(ProductNotFoundError);
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore()
        
        });
        
        test("should reject with an error if there is a database operation error", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error"), null);
                return {} as Database;
            });
        
            const productDAO = new ProductDAO();
            await expect(productDAO.deleteProduct("model"))
                .rejects.toThrow("Database error");
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore()
        
        });

        test('should reject with an error if unable to connect to the database', async () => {
            const productDAO = new ProductDAO();
        
            const mockDBGet = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                throw new Error('Unable to connect to the database');
            });
        
            const rejectMock = jest.fn();
        
            try {
                await productDAO.deleteProduct(null);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Unable to connect to the database');
                rejectMock(error);
            }
        
            expect(rejectMock).toHaveBeenCalled();
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore();
        });

        test('should reject with an error if unable to connect to the database', async () => {
            const productDAO = new ProductDAO();
        
            const mockDBGet = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                throw new Error('Unable to connect to the database');
            });
        
            const rejectMock = jest.fn();
        
            try {
                await productDAO.deleteProduct("testModel");
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Unable to connect to the database');
                rejectMock(error);
            }
        
            expect(rejectMock).toHaveBeenCalled();
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            mockDBGet.mockRestore();
        });

        test('should reject with an error if unable to delete all products', async () => {
            const productDAO = new ProductDAO();

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Unable to delete all products'));
                return {} as Database;
            });
    
            const rejectMock = jest.fn();
    
            try {
                await productDAO.deleteProduct(null);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Unable to delete all products');
                rejectMock(error);
            }
    
            expect(rejectMock).toHaveBeenCalled();
            expect(mockDBRun).toHaveBeenCalledTimes(1);
            mockDBRun.mockRestore();
        });

        test('should reject with an error if unable to delete a single product', async () => {
            const productDAO = new ProductDAO();

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Unable to delete product'));
                return {} as Database;
            });
    
            const rejectMock = jest.fn();
    
            try {
                await productDAO.deleteProduct("testProduct");
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Unable to delete product');
                rejectMock(error);
            }
    
            expect(rejectMock).toHaveBeenCalled();
            expect(mockDBRun).toHaveBeenCalledTimes(1);
            mockDBRun.mockRestore();
        });
    })
})
