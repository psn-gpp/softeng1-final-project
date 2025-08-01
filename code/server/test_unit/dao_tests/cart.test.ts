import {test, expect, jest, describe, beforeEach} from "@jest/globals"
import CartDAO from "../../src/dao/cartDAO"
import db from "../../src/db/db"
import ProductDAO from "../../src/dao/productDAO"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Role, User } from "../../src/components/user"
import { Database } from "sqlite3"
import { Category, Product } from "../../src/components/product"
import UserDAO from "../../src/dao/userDAO"
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from '../../src/errors/cartError'
import {EmptyProductStockError, LowProductStockError, ProductNotFoundError} from '../../src/errors/productError'

jest.mock("../../src/db/db.ts")
jest.mock("../../src/dao/productDAO.ts")
    

const customer : User = new User("test", "test", "test", Role.CUSTOMER, "test", "test")
const prodsInCart : ProductInCart[] = [new ProductInCart("test1",10,Category.APPLIANCE, 100),new ProductInCart("test2",10,Category.APPLIANCE, 100)]
// @ts-ignore
const cartFull : Cart = new Cart(customer.name, false, null, 2000, prodsInCart)
// @ts-ignore
const cartEmpty : Cart = new Cart(customer.username, false, null, 0, []);
const cartDAO = new CartDAO()
const prod = new Product(100, 'test3',Category.APPLIANCE,null, null, 10)
const cartID = 10;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });


//tests for getCurrentUserCart
describe("getCurrentUserCart", () => {


    test('should return user cart if exists', async () => {
        const mockDBGet = jest.spyOn(db, 'get')
        .mockImplementation((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        })

        const mockGetAllProducts = jest.spyOn(cartDAO,"getAllProductsInCart").mockResolvedValue(prodsInCart)

        const currentCart = await cartDAO.getCurrentUserCart(customer)
        expect(currentCart).toEqual(cartFull)
        expect(mockDBGet).toHaveBeenCalledTimes(1)
        expect(mockGetAllProducts).toHaveBeenCalledTimes(1)

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    })

    test("should return empty cart if cart not exists for user", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })
        const mockCreateEmptyCart = jest.spyOn(cartDAO, 'createEmptyCart').mockResolvedValue(10)

        const currentCart = await cartDAO.getCurrentUserCart(customer)
        
        expect(currentCart).toEqual(cartEmpty)

        expect(mockDBGet).toHaveBeenCalledTimes(1);
        expect(mockCreateEmptyCart).toHaveBeenCalledTimes(0);

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    })

    test("should return empty cart if there is no unpaid cart in the database", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })
        const mockCreateEmptyCart = jest.spyOn(cartDAO, 'createEmptyCart').mockResolvedValue(10)

        const currentCart = await cartDAO.getCurrentUserCart(customer)

        expect(currentCart).toEqual(cartEmpty)

        expect(mockDBGet).toHaveBeenCalledTimes(1);
        expect(mockCreateEmptyCart).toHaveBeenCalledTimes(0);

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    })

    test("should return empty cart if there is an unpaid cart with no products", async () => {
        const mockDBGet = jest.spyOn(db, 'get')
        .mockImplementation((sql, params, callback) => {
            callback(null, cartEmpty)
            return {} as Database
        })
        const mockCreateEmptyCart = jest.spyOn(cartDAO, 'createEmptyCart').mockResolvedValue(10)

        const mockGetAllProducts = jest.spyOn(cartDAO,"getAllProductsInCart").mockResolvedValue([])

        const currentCart = await cartDAO.getCurrentUserCart(customer)

        expect(currentCart).toEqual(cartEmpty)
        expect(mockDBGet).toHaveBeenCalledTimes(1);
        expect(mockGetAllProducts).toHaveBeenCalledTimes(1)

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    })

    test("should reject if there is an error in the database", async () => {
        const dbError = new Error('Database error');
        
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(dbError, null)
            return {} as Database
        })

        await expect(cartDAO.getCurrentUserCart(customer)).rejects.toThrow(new Error('Database error'));
        

        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    })

    test("should reject if there is a generic error", async () => {
        const error = new Error('Unexpected error');
        
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            throw error
        })

        
        await expect(cartDAO.getCurrentUserCart(customer)).rejects.toThrow(error);
        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();

    }, 10000)


})



// tests for addProduct
describe("addProduct", () => {

    test("should add a product with quantity 1 if that product isn't in cart", async () => {
        const prod = new Product(10,'test3', Category.APPLIANCE,null, null, 100)
        // @ts-ignore
        const cartWithProduct = new Cart(customer.name, false, null, 10, [new ProductInCart('test3', 1, Category.APPLIANCE, 10)])
        
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, cartEmpty)
            return {} as Database
        })
        
        const mockSearchProduct = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod])
        const mockProductInCart = jest.spyOn(cartDAO, 'getProductInCart').mockResolvedValue(new ProductInCart('test3', 0, Category.APPLIANCE, 10))
        const mockAddSingleProd = jest.spyOn(cartDAO, 'addSingleProduct').mockResolvedValue(true)
        const mockUpdateTotal = jest.spyOn(cartDAO, 'updateCartTotal').mockResolvedValue(true)

        

        const newCart = await cartDAO.addProduct(customer,'test3')
        expect(newCart).toEqual(true)
        expect(mockAddSingleProd).toHaveBeenCalled()

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    
    }, 10000)

    test("should increase product quantity if that product is in cart", async () => {
        const prod = new Product(10,'test3', Category.APPLIANCE,null, null, 100)
        // @ts-ignore
        const cartWithProduct = new Cart(customer.name, false, null, 10, [new ProductInCart('test3', 2, Category.APPLIANCE, 10)])
        
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, cartWithProduct)
            return {} as Database
        })    
        
        const mockSearchProduct = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod])
        const mockProductInCart = jest.spyOn(cartDAO, 'getProductInCart').mockResolvedValue(new ProductInCart('test3', 1, Category.APPLIANCE, 10))
        const mockIncreaseSingleProd = jest.spyOn(cartDAO, 'increseSingleProduct').mockResolvedValue(true)
        const mockUpdateTotal = jest.spyOn(cartDAO, 'updateCartTotal').mockResolvedValue(true)

        const newCart = await cartDAO.addProduct(customer,'test3')

        // const newCartDue = new Cart(customer.name, false, null, 10, [new ProductInCart('test3', 3, Category.APPLIANCE, 10)])
        expect(newCart).toEqual(true)
        expect(mockIncreaseSingleProd).toHaveBeenCalled()
        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    })


    test("should create an empty cart if there isn't an unpaid cart for the user", async () => {
        const prod = new Product(10, 'test3', Category.APPLIANCE, null, null, 100)

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })
        .mockImplementation((sql, params, callback) => {
            callback(null, cartEmpty)
            return {} as Database
        })
        
        const mockCreateEmptyCart = jest.spyOn(cartDAO, 'createEmptyCart').mockResolvedValue(10)
        const mockSearchProduct = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod])
        const mockProductInCart = jest.spyOn(cartDAO, 'getProductInCart').mockResolvedValue(new ProductInCart('test3', 1, Category.APPLIANCE, 10))
        const mockIncreaseSingleProd = jest.spyOn(cartDAO, 'increseSingleProduct').mockResolvedValue(true)
        const mockUpdateTotal = jest.spyOn(cartDAO, 'updateCartTotal').mockResolvedValue(true)
        // const mockAddProduct = jest.spyOn(cartDAO, 'addProduct').mockResolvedValue(true)

        const newCart = await cartDAO.addProduct(customer, 'test3')
        expect(mockCreateEmptyCart).toHaveBeenCalled()
        // expect(mockAddProduct).toHaveBeenCalled()
        expect(newCart).toEqual(true)

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    }, 10000)

    test("should reject with 404 if model doesn't exists", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })
        
        const mockSearchProduct = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockRejectedValue(new ProductNotFoundError)

        await expect(cartDAO.addProduct(customer, 'test3')).rejects.toThrow(new ProductNotFoundError)
    
        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    })

    test("should reject with 409 if model has quantity 0", async () => {
        const prod = new Product(10, 'test3', Category.APPLIANCE, null, null, 0)

        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, cartEmpty)
            return {} as Database
        })
        
        const mockSearchProduct = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockRejectedValue(new EmptyProductStockError)

        await expect(cartDAO.addProduct(customer, 'test3')).rejects.toThrow(new EmptyProductStockError)

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    
    })

    test("should reject if there is a database error", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null)
            return {} as Database
        })


        await expect(cartDAO.addProduct(customer, "model")).rejects.toThrow(new Error('Database error'))

        expect(mockDBGet).toHaveBeenCalledTimes(1);

        mockDBGet.mockClear();
        mockDBGet.mockRestore();

    })

    test("should reject if there is an unexpected error in the second call of addProduct asfter createEmptyCart", async () => {
        const prod = new Product(10, 'test3', Category.APPLIANCE, null, null, 100)

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })
        .mockImplementation((sql, params, callback) => {
            throw new Error("Unexpected error")
        })
        
        const mockCreateEmptyCart = jest.spyOn(cartDAO, 'createEmptyCart').mockResolvedValue(10)
        const mockSearchProduct = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod])

        await expect(cartDAO.addProduct(customer, 'test3')).rejects.toThrow('Unexpected error')
        expect(mockCreateEmptyCart).toHaveBeenCalled()

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    }, 10000)

    test("should reject if there is an unexpected error when calling updateCartTotal", async () => {
        const prod = new Product(10, 'test3', Category.APPLIANCE, null, null, 100)

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        })
        
        
        // const mockCreateEmptyCart = jest.spyOn(cartDAO, 'createEmptyCart').mockResolvedValue(10)
        const mockSearchProduct = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod])
        const mockProductInCart = jest.spyOn(cartDAO, 'getProductInCart').mockResolvedValue(new ProductInCart('test3', 1, Category.APPLIANCE, 10))
        const mockIncreaseSingleProd = jest.spyOn(cartDAO, 'increseSingleProduct').mockResolvedValue(true)
        const mockUpdateTotal = jest.spyOn(cartDAO, 'updateCartTotal').mockImplementation((cartid) => {
            throw new Error("Unexpected error")
        })
        await expect(cartDAO.addProduct(customer, 'test3')).rejects.toThrow('Unexpected error')

        
        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    }, 10000)

})

// checkOutCart tests
describe("checkOutCart", () => {

    test("should successfully check out the cart", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(prodsInCart);
        const mockProductExist = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod]);
        const mockSellProduct = jest.spyOn(ProductDAO.prototype, 'sellProduct').mockResolvedValue(99);
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const result = await cartDAO.checkOutCart(customer);
        expect(result).toEqual(true);
    });

    test("should return a 404 error if there is no unpaid cart", async () => {

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow(new CartNotFoundError);
    });

    test("should return a 400 error if the cart contains no product", async () => {

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartEmpty)
            return {} as Database
        });

        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue([]);

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow(new EmptyCartError);
    });

    test("should return a 409 error if there is a product in the cart with stock quantity 0", async () => {
        const prodsNoQuantity : ProductInCart[] = [new ProductInCart('test3',0,Category.APPLIANCE,100)]
        const prodNoQuantity = new Product(100, 'test3',Category.APPLIANCE,null, null, 0)

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        });

        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(prodsNoQuantity);
        const mockProductExist = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prodNoQuantity]);

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow(new EmptyProductStockError);
    });

    test("should return a 409 error if there is a product in the cart with stock quantity less than required", async () => {
        const productsInCart = [new ProductInCart('test3', 10, Category.APPLIANCE, 10)];
        const product = new Product(5, 'test3', Category.APPLIANCE, null, null, 5);

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        });

        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(productsInCart);
        const mockProductExist = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([product]);

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow(new LowProductStockError);
    });

    test("should reject if there is a database error", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null)
            return {} as Database
        })

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow(new Error('Database error'))

        expect(mockDBGet).toHaveBeenCalledTimes(1);

        mockDBGet.mockClear();
        mockDBGet.mockRestore();

    })

    test("should reject if there is an unexpected error in getProductByModel ", async () => {
        const productsInCart = [new ProductInCart('test3', 10, Category.APPLIANCE, 10)];
        const product = new Product(5, 'test3', Category.APPLIANCE, null, null, 5);

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        });

        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(productsInCart)
        const mockProductExist = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockImplementation(() => {
            throw new Error("Unexpected error")
        })

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow("Unexpected error");

        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    });

    
    test("should reject if there is an unexpected error in sellProduct", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(prodsInCart);
        const mockProductExist = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod]);
        const mockSellProduct = jest.spyOn(ProductDAO.prototype, 'sellProduct').mockImplementation(() => {
            throw new Error("Unexpected error")
        })

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow("Unexpected error")

        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    });

    test("should reject if there is an unexpected error in DBRun", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, cartFull)
            return {} as Database
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(prodsInCart);
        const mockProductExist = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod]);
        const mockSellProduct = jest.spyOn(ProductDAO.prototype, 'sellProduct').mockResolvedValue(99);
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database Error"))
            return {} as Database
        });

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow("Database Error")

        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    });

    
    test("should reject if there is an unexpected error in DBGet", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unexpected error")
        });

        await expect(cartDAO.checkOutCart(customer)).rejects.toThrow("Unexpected error")

        mockDBGet.mockClear();
        mockDBGet.mockRestore();
    });
});


describe("getPaidUserCarts", () => {

    test("should return an array of paid carts if they are present", async () => {
        const dbRows = [
            { customer: customer.username, paid: 1, paymentDate: '2023-06-01', total: 2000, CartID: 1 }
        ];
    
        const paidCarts = [
            new Cart(customer.username, true, '2023-06-01', 2000, prodsInCart)
        ];
    
        const mockDBAll = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
            callback(null, dbRows);
            return {} as Database;
        });
    
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(prodsInCart);
    
        const result = await cartDAO.getPaidUserCarts(customer);
    
        expect(result).toEqual(paidCarts);
        expect(mockDBAll).toHaveBeenCalledTimes(1);
        expect(mockGetAllProductsInCart).toHaveBeenCalledTimes(dbRows.length);        
    });

    test("should return an empty array if there are no paid carts", async () => {
        const mockDBAll = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const result = await cartDAO.getPaidUserCarts(customer);

        expect(result).toEqual([]);
        expect(mockDBAll).toHaveBeenCalledTimes(1)
    });

    test("should reject the promise if there is a database error", async () => {
        const mockDBAll = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
            callback(new Error('Database error'), null);
            return {} as Database;
        });

        await expect(cartDAO.getPaidUserCarts(customer)).rejects.toThrow('Database error');
        expect(mockDBAll).toHaveBeenCalledTimes(1)
    });

    test("should reject if there is an unexpected error in DBAll", async () => {
        const mockDBGet = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unexpected error")
        });

        await expect(cartDAO.getPaidUserCarts(customer)).rejects.toThrow("Unexpected error")
    });
});


/** removeProduct */
describe("removeProduct", () => {

    test("should successfully remove one unit of a product when more than one unit is in the cart", async () => {
        const productInCart = new ProductInCart("test1", 2, Category.APPLIANCE, 100);
        // @ts-ignore
        const cartRow = new Cart(customer.name, false, null, 2000, [productInCart]);

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartRow);
            return {} as Database;
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue([productInCart]);
        const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod]);
        const mockGetProductInCart = jest.spyOn(cartDAO, 'getProductInCart').mockResolvedValue(productInCart);
        const mockDecreseSingleProduct = jest.spyOn(cartDAO, 'decreseSingleProduct').mockResolvedValue(true);
        const mockUpdateCartTotal = jest.spyOn(cartDAO, 'updateCartTotal').mockResolvedValue(true);

        const result = await cartDAO.removeProduct(customer, "test1");
        
        expect(result).toEqual(true);
        expect(mockDecreseSingleProduct).toHaveBeenCalledTimes(1)
    });

    test("should successfully remove the product when only one unit is in the cart", async () => {
        const productInCart = new ProductInCart("test1", 1, Category.APPLIANCE, 100);
        // @ts-ignore
        const cartRow = new Cart(customer.name, false, null, 2000, [productInCart]);

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartRow);
            return {} as Database;
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue([productInCart]);
        const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod]);
        const mockGetProductInCart = jest.spyOn(cartDAO, 'getProductInCart').mockResolvedValue(productInCart);
        const mockRemoveSingleProduct = jest.spyOn(cartDAO, 'removeSingleProduct').mockResolvedValue(true);
        const mockUpdateCartTotal = jest.spyOn(cartDAO, 'updateCartTotal').mockResolvedValue(true);

        const result = await cartDAO.removeProduct(customer, "test1");
        
        expect(result).toEqual(true);
        expect(mockRemoveSingleProduct).toHaveBeenCalledTimes(1)
    });

    test("should return a 404 error if the product is not in the cart", async () => {
        // @ts-ignore
        const cartRow = new Cart(customer.name, false, null, 0, []);
                
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartRow);
            return {} as Database;
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue([]);

        await expect(cartDAO.removeProduct(customer, "test1")).rejects.toThrow(new ProductNotInCartError);
    });

    test("should return a 404 error if there is no unpaid cart for the user", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(cartDAO.removeProduct(customer, "test1")).rejects.toThrow(new CartNotFoundError);
    });

    test("should return a 404 error if the product does not exist", async () => {
        const cartRow = { CartID: 1, customer: customer.username, paid: 0 };
        
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartRow);
            return {} as Database;
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(prodsInCart);
        const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockRejectedValue(new ProductNotFoundError);

        await expect(cartDAO.removeProduct(customer, "test1")).rejects.toThrow(new ProductNotFoundError);
    });

    test("should reject the promise if there is a database error", async () => {
        const mockDBAll = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(new Error('Database error'), null);
            return {} as Database;
        });

        await expect(cartDAO.removeProduct(customer, "prod")).rejects.toThrow('Database error');
        expect(mockDBAll).toHaveBeenCalledTimes(1)
    });


    test("should reject the promise if there is an unexpected error in the getAllProductsInCart", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unexpected error")
        });

        await expect(cartDAO.removeProduct(customer, "test1")).rejects.toThrow("Unexpected error")

    });
    

    test("should reject if there is an unexpected error in getProductsInCart", async () => {
        const productInCart = new ProductInCart("test1", 2, Category.APPLIANCE, 100);
        // @ts-ignore
        const cartRow = new Cart(customer.name, false, null, 2000, [productInCart]);

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartRow);
            return {} as Database;
        });
        
        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue([productInCart]);
        const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue([prod]);
        const mockGetProductInCart = jest.spyOn(cartDAO, 'getProductInCart').mockImplementation(() => {
            throw new Error("Unexpected error")
        })

        await expect(cartDAO.removeProduct(customer, "test1")).rejects.toThrow("Unexpected error")
    });

    
});

/** clear Cart */
describe("clearCart", () => {



    test("should successfully clear the cart", async () => {

        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, cartFull);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.clearCart(customer);
        
        expect(result).toEqual(true);
        expect(mockDBGet).toHaveBeenCalledTimes(1)
        expect(mockDBRun).toHaveBeenCalledTimes(1)
    });

    test("should return a 404 error if there is no unpaid cart for the user", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(cartDAO.clearCart(customer)).rejects.toThrow(new CartNotFoundError);
        expect(mockDBGet).toHaveBeenCalledTimes(1)
        expect(mockDBRun).toHaveBeenCalledTimes(0)
        
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("should return an error if there is a database error when finding the cart", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(new Error('Database error'), null);
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        
        await expect(cartDAO.clearCart(customer)).rejects.toThrow('Database error');
        expect(mockDBGet).toHaveBeenCalledTimes(1)
        expect(mockDBRun).toHaveBeenCalledTimes(0)
        
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("should return an error if there is a database error when clearing the cart", async () => {
        
        const cartRow = { CartID: 1, customer: customer.username, paid: 0 };

        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, cartRow);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'));
            return {} as Database;
        });

        await expect(cartDAO.clearCart(customer)).rejects.toThrow('Database error');
        expect(mockDBGet).toHaveBeenCalledTimes(1)
        expect(mockDBRun).toHaveBeenCalledTimes(1)

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });


    test("should reject if there is an unexpected error in DBAll", async () => {
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unexpected error")
        });

        await expect(cartDAO.clearCart(customer)).rejects.toThrow("Unexpected error")
    })
});

describe("deleteAllCarts", () => {

    test("should successfully delete all carts", async () => {
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.deleteAllCarts();

        expect(result).toEqual(true);
        expect(mockDBRun).toHaveBeenCalled()

        
        mockDBRun.mockRestore();
    })

    test("should return an error if there is a database error", async () => {
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, callback) => {
            callback(new Error('Database error'));
            return {} as Database;
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow('Database error');
        expect(mockDBRun).toHaveBeenCalled()
        
        mockDBRun.mockRestore();

    });

    test("should reject if there is an unexpected error in DBAll", async () => {
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unexpected error")
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow("Unexpected error")
    })

})


describe("getAllCarts", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test("should return all carts", async () => {
        const rows = [
            { CartID: 1, customer: customer.username, paid: 0, paymentDate: null, total: 2000 , prodsInCart},
            { CartID: 2, customer: customer.username, paid: 1, paymentDate: '2024-06-01', total: 1000 , prodsInCart}
        ];

        const mockDBAll = jest.spyOn(db, 'all').mockImplementationOnce((sql, callback) => {
            callback(null, rows);
            return {} as Database;
        });

        const mockGetAllProductsInCart = jest.spyOn(cartDAO, 'getAllProductsInCart').mockResolvedValue(prodsInCart);

        const result = await cartDAO.getAllCarts();

        expect(result).toEqual([
            // @ts-ignore
            new Cart(customer.username, false, null, 2000, prodsInCart),
            new Cart(customer.username, true, '2024-06-01', 1000, prodsInCart)
        ]);
        expect(mockDBAll).toHaveBeenCalled();
        expect(mockGetAllProductsInCart).toHaveBeenCalledTimes(2);
    });

    test("should return an empty array if no carts are found", async () => {
        const mockDBAll = jest.spyOn(db, 'all').mockImplementationOnce((sql, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const result = await cartDAO.getAllCarts();

        expect(result).toEqual([]);
        expect(mockDBAll).toHaveBeenCalled();
    });

    test("should return an error if there is a database error", async () => {
        const mockDBAll = jest.spyOn(db, 'all').mockImplementationOnce((sql, callback) => {
            callback(new Error('Database error'), null);
            return {} as Database;
        });

        await expect(cartDAO.getAllCarts()).rejects.toThrow('Database error');
        expect(mockDBAll).toHaveBeenCalled();
    });

    test("should reject if there is an unexpected error in DBAll", async () => {
        const mockDBGet = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unexpected error")
        });

        await expect(cartDAO.getAllCarts()).rejects.toThrow("Unexpected error")
    })
});


describe("createEmptyCart", () => {

    test("should successfully create an empty cart and return the last inserted ID", async () => {
        const lastInsertedId = 1;

        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback.call({ lastID: lastInsertedId }, null);
            return {} as Database;
        });

        const result = await cartDAO.createEmptyCart(customer.name);

        expect(result).toEqual(lastInsertedId);
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.createEmptyCart(customer.name)).rejects.toThrow("Database error");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (callback)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"));
            return {} as Database;
        });

        await expect(cartDAO.createEmptyCart(customer.name)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (throw)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.createEmptyCart(customer.name)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });
});


describe("getAllProductsInCart", () => {


    test("should successfully return all products in the cart", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(null, prodsInCart);
            return {} as Database;
        });

        const result = await cartDAO.getAllProductsInCart(cartID);

        expect(result).toEqual(prodsInCart);
        expect(mockDBAll).toHaveBeenCalled()
    });

    test("should return an empty array if no products are found", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        const result = await cartDAO.getAllProductsInCart(cartID);

        expect(result).toEqual([]);
        expect(mockDBAll).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as Database;
        });

        await expect(cartDAO.getAllProductsInCart(cartID)).rejects.toThrow("Database error");
        expect(mockDBAll).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (callback)", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"), null);
            return {} as Database;
        });

        await expect(cartDAO.getAllProductsInCart(cartID)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBAll).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (throw)", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.getAllProductsInCart(cartID)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBAll).toHaveBeenCalled()
    });
});


describe("getProductInCart", () => {
    
    test("should successfully return the product in the cart", async () => {
        const prodInCart = new ProductInCart("model", 10, Category.APPLIANCE, 100)

        const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            callback(null, prodInCart);
            return {} as Database;
        });

        const result = await cartDAO.getProductInCart(cartID, "model", true);

        expect(result).toEqual(prodInCart);
        expect(mockDBGet).toHaveBeenCalled()
    });

    test("should return a product with quantity 0 if the product is not in the cart", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const result = await cartDAO.getProductInCart(cartID, "model", true);
        // @ts-ignore
        expect(result).toEqual(new ProductInCart("model", 0, null, 0));
        expect(mockDBGet).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as Database;
        });

        await expect(cartDAO.getProductInCart(cartID, "model", true)).rejects.toThrow("Database error");
        expect(mockDBGet).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (callback)", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"), null);
            return {} as Database;
        });

        await expect(cartDAO.getProductInCart(cartID, "model", true)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBGet).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (throw)", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.getProductInCart(cartID, "model", true)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBGet).toHaveBeenCalled()
    });

    test("should reject with error ProductNotInCart if product is not in cart and it is called by removeProduct function (flag false)", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(cartDAO.getProductInCart(cartID, "model", false)).rejects.toThrow(new ProductNotInCartError);
        expect(mockDBGet).toHaveBeenCalled()
    })
});


describe("removeSingleProduct", () => {


    test("should successfully remove the product from the cart", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.removeSingleProduct(cartID, "model");

        expect(result).toEqual(true);
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.removeSingleProduct(cartID, "model")).rejects.toThrow("Database error");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (callback)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"));
            return {} as Database;
        });

        await expect(cartDAO.removeSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (throw)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.removeSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });
});


describe("addSingleProduct", () => {

    test("should successfully add the product to the cart", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.addSingleProduct(cartID, "model");

        expect(result).toEqual(true);
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.addSingleProduct(cartID, "model")).rejects.toThrow("Database error");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (callback)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"));
            return {} as Database;
        });

        await expect(cartDAO.addSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (throw)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.addSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });
});


describe("decreseSingleProduct", () => {

    test("should successfully decrease the product quantity in the cart", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.decreseSingleProduct(cartID, "model");

        expect(result).toEqual(true);
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.decreseSingleProduct(cartID, "model")).rejects.toThrow("Database error");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (callback)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"));
            return {} as Database;
        });

        await expect(cartDAO.decreseSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (throw)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.decreseSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });
});


describe("increseSingleProduct", () => {


    test("should successfully increase the product quantity in the cart", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.increseSingleProduct(cartID, "model");

        expect(result).toEqual(true);
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.increseSingleProduct(cartID, "model")).rejects.toThrow("Database error");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (callback)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"));
            return {} as Database;
        });

        await expect(cartDAO.increseSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if unable to connect to the database (throw)", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.increseSingleProduct(cartID, "model")).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalled()
    });
});


describe("updateCartTotal", () => {
    

    test("should successfully update the cart total", async () => {
        const productInCartData = prodsInCart

        const total = productInCartData.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(null, productInCartData);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await cartDAO.updateCartTotal(cartID);

        expect(result).toEqual(true);
        expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [cartID], expect.any(Function));
        expect(mockDBRun).toHaveBeenCalledWith("UPDATE cart SET total = ? WHERE CartID = ?", [total, cartID], expect.any(Function));
    });

    test("should resolve with true if no products are found in the cart", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });


        const result = await cartDAO.updateCartTotal(cartID);

        expect(result).toEqual(true);
        expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [cartID], expect.any(Function));
        expect(mockDBRun).toHaveBeenCalled()
    });

    test("should reject with an error if there is a database operation error on getProducts", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as Database;
        });

        await expect(cartDAO.updateCartTotal(cartID)).rejects.toThrow("Database error");
        expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [cartID], expect.any(Function));
    });

    test("should reject with an error if there is a database operation error on updateTotal", async () => {
        const productInCartData = prodsInCart
        const total = productInCartData.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(null, productInCartData);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(cartDAO.updateCartTotal(cartID)).rejects.toThrow("Database error");
        expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [cartID], expect.any(Function));
        expect(mockDBRun).toHaveBeenCalledWith("UPDATE cart SET total = ? WHERE CartID = ?", [total, cartID], expect.any(Function));
    });

    test("should reject with an error if unable to connect to the database on getProducts (callback)", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"), null);
            return {} as Database;
        });

        await expect(cartDAO.updateCartTotal(cartID)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [cartID], expect.any(Function));
    });

    test("should reject with an error if unable to connect to the database on getProducts (throw)", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.updateCartTotal(cartID)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [cartID], expect.any(Function));
    });

    test("should reject with an error if unable to connect to the database on updateTotal (callback)", async () => {
        const productInCartData = prodsInCart

        const total = productInCartData.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(null, productInCartData);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Unable to connect to the database"));
            return {} as Database;
        });

        await expect(cartDAO.updateCartTotal(cartID)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalledWith("UPDATE cart SET total = ? WHERE CartID = ?", [total, cartID], expect.any(Function));
    });

    test("should reject with an error if unable to connect to the database on updateTotal (throw)", async () => {
        const productInCartData = prodsInCart
        const total = productInCartData.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
            callback(null, productInCartData);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
            throw new Error("Unable to connect to the database");
        });

        await expect(cartDAO.updateCartTotal(cartID)).rejects.toThrow("Unable to connect to the database");
        expect(mockDBRun).toHaveBeenCalledWith("UPDATE cart SET total = ? WHERE CartID = ?", [total, cartID], expect.any(Function));
    });
});
