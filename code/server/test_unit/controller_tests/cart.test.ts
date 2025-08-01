import { afterEach, describe, test, expect, jest } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import dayjs from "dayjs"
import { Role, User } from "../../src/components/user"
import { Product, Category } from "../../src/components/product"
import { Cart, ProductInCart } from "../../src/components/cart"

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

jest.mock("../../src/dao/cartDAO")

const customer : User = new User("test", "test", "test", Role.CUSTOMER, "test", "test")
const prodsInCart : ProductInCart[] = [new ProductInCart("test1",10,Category.APPLIANCE, 100),new ProductInCart("test2",10,Category.APPLIANCE, 100)]
const cartFull : Cart = new Cart(customer.username, false, dayjs().format("YYYY-MM-DD"), 2000, prodsInCart)
const cartEmpty : Cart = new Cart(customer.username, false, dayjs().format("YYYY-MM-DD"), 0, []);
const cartDAO = new CartDAO()
const prod = new Product(100, 'test3',Category.APPLIANCE,null, null, 10)

describe("Cart controller unit tests", () => {
    describe("Add a product to the cart", () => {

        test("Adds one instance of a product to the user cart (returns true)", async () => {
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "addProduct").mockResolvedValueOnce(true);
            const controller = new CartController();

            const response = await controller.addToCart(
                customer,
                testProduct,
            );
        
            expect(CartDAO.prototype.addProduct).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addProduct).toHaveBeenCalledWith(
                customer,
                testProduct,
            );
            expect(response).toBe(true);
        });
    })

    describe("Gets the user cart", () => {

        test("Gets the user unpaid cart (returns Cart)", async () => {
            const testUser = "testUser";
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "getCurrentUserCart").mockResolvedValueOnce(cartEmpty);
            const controller = new CartController();

            const response = await controller.getCart(
                customer
            );
        
            expect(CartDAO.prototype.getCurrentUserCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCurrentUserCart).toHaveBeenCalledWith(
                customer
            );
            expect(response).toBe(cartEmpty);
        });
    })

    describe("Checks out the user current cart", () => {

        test("Checks out the user current cart (returns true)", async () => {
            const testUser = "testUser";
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "checkOutCart").mockResolvedValueOnce(true);
            const controller = new CartController();

            const response = await controller.checkoutCart(
                customer
            );
        
            expect(CartDAO.prototype.checkOutCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.checkOutCart).toHaveBeenCalledWith(
                customer
            );
            expect(response).toBe(true);
        });
    })

    describe("Retrieves all paid carts for a specific customer", () => {

        test("Retrieves all paid carts for a specific customer (returns Cart[])", async () => {
            const testUser = "testUser";
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "getPaidUserCarts").mockResolvedValueOnce([cartEmpty, cartFull]);
            const controller = new CartController();

            const response = await controller.getCustomerCarts(
                customer
            );
        
            expect(CartDAO.prototype.getPaidUserCarts).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getPaidUserCarts).toHaveBeenCalledWith(
                customer
            );
            expect(response).toStrictEqual([cartEmpty, cartFull]);
        });
    })

    describe("Remove a product to the cart", () => {

        test("Remove one instance of a product to the user cart (returns true)", async () => {
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "removeProduct").mockResolvedValueOnce(true);
            const controller = new CartController();

            const response = await controller.removeProductFromCart(
                customer,
                testProduct,
            );
        
            expect(CartDAO.prototype.removeProduct).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProduct).toHaveBeenCalledWith(
                customer,
                testProduct,
            );
            expect(response).toBe(true);
        });
    })

    describe("Removes all products from the current cart", () => {

        test("Removes all products from the current cart (returns true)", async () => {
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true);
            const controller = new CartController();

            const response = await controller.clearCart(
                customer,
            );
        
            expect(CartDAO.prototype.clearCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(
                customer,
            );
            expect(response).toBe(true);
        });
    })

    describe("Deletes all carts of all users", () => {

        test("Deletes all carts of all users (returns true)", async () => {
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
            const controller = new CartController();

            const response = await controller.deleteAllCarts();
        
            expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledWith();
            expect(response).toBe(true);
        });
    })

    describe("Retrieves all carts in the database.", () => {

        test("Retrieves all carts in the database (returns Cart[])", async () => {
            const testProduct = "testProduct";

            jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce([cartEmpty, cartFull]);
            const controller = new CartController();

            const response = await controller.getAllCarts();
        
            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledWith();
            expect(response).toStrictEqual([cartEmpty, cartFull]);
        });
    })
})


