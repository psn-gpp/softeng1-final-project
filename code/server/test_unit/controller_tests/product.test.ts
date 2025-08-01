import { afterEach, describe, test, expect, jest } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"
import dayjs from "dayjs"
import { Product, Category } from "../../src/components/product"
import { ArrivalDateError, GetProductsError } from "../../src/errors/productError"

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

jest.mock("../../src/dao/productDAO")

describe("Product controller unit tests", () => {
    describe("Register products arrival", () => {

        test("Register the arrival of a set of products (returns undefined)", async () => {
            const testProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();

            const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
        
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            );
            expect(response).toBe(undefined);
        });
        
        test("Register products with a future arrival date (returns error)", async () => {
            const tomorrowDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
            const testProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: tomorrowDate,
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
        
            const controller = new ProductController();
            await expect(controller.registerProducts(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            )).rejects.toThrow(ArrivalDateError);
            
        });
        
        test("Register the arrival of a set of products with null date (returns undefined)", async () => {
            const testProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, null);
        
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                null
            );
            expect(response).toBe(undefined);
        });
    })
    
    describe("Update product quantity", () => {

        test("Update product quantity (returns 110)", async () => {
            const createProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce(); 
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
        
            const testProduct = {
                model: "test",
                newQuantity: 10,
                changeDate: dayjs().format('YYYY-MM-DD'),
            }

            jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce(110);
            const response = await controller.changeProductQuantity(testProduct.model, testProduct.newQuantity, testProduct.changeDate);
        
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(
                testProduct.model, testProduct.newQuantity, testProduct.changeDate
            );
            expect(response).toBe(110);
        });
        
        test("Update product quantity but the date is wrong (returns error)", async () => {
            const createProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(
                createProduct.model,
                createProduct.category,
                createProduct.quantity,
                createProduct.details,
                createProduct.sellingPrice,
                createProduct.arrivalDate
            );
        
            const testProduct = {
                model: "test",
                newQuantity: 10,
                changeDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockRejectedValueOnce(new ArrivalDateError);
            await expect(controller.changeProductQuantity(testProduct.model, testProduct.newQuantity, testProduct.changeDate)).rejects.toThrow(ArrivalDateError);
        });
    })
    
    describe("Sell a product", () => {
        
        test("Sell a product (returns 90)", async () => {
            const createProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
        
            const testProduct = {
                model: "test",
                quantity: 10,
                sellingDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce(90);
            const response = await controller.sellProduct(testProduct.model, testProduct.quantity, testProduct.sellingDate);
        
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(
                testProduct.model, testProduct.quantity, testProduct.sellingDate
            );
            expect(response).toBe(90);
        });
        
        test("Sell a product with wrong date (returns error)", async () => {
            const createProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
        
            const controller = new ProductController();
        
            await controller.registerProducts(
                createProduct.model,
                createProduct.category,
                createProduct.quantity,
                createProduct.details,
                createProduct.sellingPrice,
                createProduct.arrivalDate
            );
        
            const testProduct = {
                model: "test",
                quantity: 10,
                sellingDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "sellProduct").mockRejectedValueOnce(new ArrivalDateError);
            await expect(controller.sellProduct(testProduct.model, testProduct.quantity, testProduct.sellingDate)).rejects.toThrow(ArrivalDateError);
        });
    })
    
    describe("Delete ALL products", () => {
        
        test("Delete ALL products (returns true)", async () => {
            const createProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
        
        
            jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);
            const response = await controller.deleteAllProducts();
        
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(null);
            expect(response).toBe(true); 
        });
    })
    
    describe("Delete ALL products", () => {

        test("Delete a single product (returns true)", async () => {
            const createProduct = {
                model: "test",
                category: "Smartphone",
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce(); 
            const controller = new ProductController(); 
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
        
        
            jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);
            const response = await controller.deleteProduct(createProduct.model);
        
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(createProduct.model);
            expect(response).toBe(true); 
        });
    })

    describe("Get avaiable products", () => {

        test("Get avaiable product by model (returns [createProduct])", async () => {
            const createProduct:Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "model",
                model: "test",
            }
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            const response = await controller.getAvailableProducts(testProduct.grouping, null, testProduct.model);
        
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(
                testProduct.model
            );
            expect(response).toEqual([createProduct]);
        });
        
        test("Get avaiable products by category (returns [createProduct])", async () => {
            const createProduct:Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
            }
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            const response = await controller.getAvailableProducts(testProduct.grouping, testProduct.category, null);
        
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith(
                testProduct.category
            );
            expect(response).toEqual([createProduct]);
        });
        
        test("Get ALL avaiable products (returns [createProduct])", async () => {
            const createProduct:Product = { 
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce(); 
            const controller = new ProductController(); 
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce([createProduct]); 
            const response = await controller.getAvailableProducts(null, null, null);
        
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(response).toEqual([createProduct]);
        });
    })
    
    describe("Get products", () => {

        test("Get product by model (returns [createProduct])", async () => {
            const createProduct:Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 0,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "model",
                model: "test",
            }
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            const response = await controller.getProducts(testProduct.grouping, null, testProduct.model);
        
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(
                testProduct.model
            );
            expect(response).toEqual([createProduct]);
        });
        
        test("Get products by category (returns [createProduct])", async () => {
            const createProduct:Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 0,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
            }
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            const response = await controller.getProducts(testProduct.grouping, testProduct.category, null);
        
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith(
                testProduct.category
            );
            expect(response).toEqual([createProduct]);
        });
        
        test("Get ALL products (returns [createProduct])", async () => {
            const createProduct:Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            }
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce([createProduct]);
            const response = await controller.getProducts(null, null, null);
        
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith();
            expect(response).toEqual([createProduct]); 
        });
    })
    
    describe("Get avaiable products errors", () => {

        test("Get products with invalid grouping (returns GetProductsError)", async () => {
            const controller = new ProductController();
        
            const invalidGrouping = "invalid_grouping";
            const category = "smartphones";
            const model = "testModel";
        
            // Eseguiamo il test
            await expect(controller.getProducts(invalidGrouping, category, model))
                .rejects
                .toThrow(GetProductsError);
        
            // Verifica che nessun metodo DAO venga chiamato
            expect(ProductDAO.prototype.getAllProducts).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.getProductsByCategory).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.getProductByModel).not.toHaveBeenCalled();
        });

        test("Get available products with invalid grouping (throws GetProductsError)", async () => {
            const controller = new ProductController();
        
            // Parametri non validi: grouping non è null, 'category', o 'model'
            const invalidGrouping = "invalid_grouping";
            const category = "smartphones";
            const model = "testModel";
        
            // Aspettati che la chiamata a getAvailableProducts con parametri non validi generi un errore
            await expect(controller.getAvailableProducts(invalidGrouping, category, model))
                .rejects
                .toThrow(GetProductsError);
        
            // Verifica che nessuno dei metodi DAO sia stato chiamato
            expect(ProductDAO.prototype.getAllProducts).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.getProductsByCategory).not.toHaveBeenCalled();
            expect(ProductDAO.prototype.getProductByModel).not.toHaveBeenCalled();
        });

        test("Get available product with null gruping and not null model (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            await expect(controller.getAvailableProducts(null, null, testProduct.model)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product with null gruping and not null category (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            await expect(controller.getAvailableProducts(null, testProduct.category, null)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is category and category is null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            await expect(controller.getAvailableProducts(testProduct.grouping, null, null)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is model and model is null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "model",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            await expect(controller.getAvailableProducts(testProduct.grouping, null, null)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is category and model is not null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            await expect(controller.getAvailableProducts(testProduct.grouping, null, testProduct.model)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is model and category is not null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController(); 
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "model",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            await expect(controller.getAvailableProducts(testProduct.grouping, testProduct.category, null)).rejects.toThrow(GetProductsError);
        });
    })
    
    describe("Get products errors", () => {

        test("Get product with null gruping and not null model (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            await expect(controller.getProducts(null, null, testProduct.model)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product with null gruping and not null category (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            await expect(controller.getProducts(null, testProduct.category, null)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is category and category is null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            await expect(controller.getProducts(testProduct.grouping, null, null)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is model and model is null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "model",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            await expect(controller.getProducts(testProduct.grouping, null, null)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is category and model is not null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController(); 
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "category",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([createProduct]);
            await expect(controller.getProducts(testProduct.grouping, null, testProduct.model)).rejects.toThrow(GetProductsError);
        });
        
        test("Get available product when grouping is model and category is not null (returns error)", async () => {
            const createProduct: Product = {
                model: "test",
                category: Category.SMARTPHONE,
                quantity: 100,
                details: "test",
                sellingPrice: 10,
                arrivalDate: dayjs().format('YYYY-MM-DD'),
            };
        
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
            const controller = new ProductController();
        
            await controller.registerProducts(createProduct.model, createProduct.category, createProduct.quantity, createProduct.details, createProduct.sellingPrice, createProduct.arrivalDate);
        
            const testProduct = {
                grouping: "model",
                category: Category.SMARTPHONE,
                model: "test",
            };
        
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([createProduct]);
            await expect(controller.getProducts(testProduct.grouping, testProduct.category, null)).rejects.toThrow(GetProductsError);
        });
    })

})


