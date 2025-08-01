import db from "../db/db";
import { Category, Product } from "../components/product";
import { User, Role } from "../components/user";
import { Cart, ProductInCart } from "../components/cart";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../errors/cartError";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, ArrivalDateError, GetProductsError} from "../errors/productError";
import dayjs from 'dayjs';
import ProductDAO from "./productDAO";

const productDAO = new ProductDAO()
/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     * 
     * Additional Constraints:
        @returns an empty Cart object if there is no information about an unpaid cart in the database, or if there is an unpaid cart with no products.
     */
    getCurrentUserCart(user: User): Promise<Cart> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "SELECT * FROM cart WHERE customer = ? AND paid = 0";
                db.get(sql, [user.username], async (err : Error, row : any) => {
                    if (err) {
                        return reject(err);
                    }

                    if (!row) {
                        // return a void cart
                        //await this.createEmptyCart(user.username);
                        const cart = new Cart(user.username, false, null, 0, []);
                        resolve(cart);
                    }else{
                        const products = await this.getAllProductsInCart(row.CartID);
                        const cart = new Cart(row.customer, row.paid === 1, row.paymentDate, row.total, products);
                        resolve(cart);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     * 
     * Additional Constraints:
        @returns a 404 error if model does not represent an existing product
        @returns a 409 error if model represents a product whose available quantity is 0
     */
    addProduct(user: User, product: string): Promise<Boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const sql = "SELECT * FROM cart WHERE customer = ? AND paid = 0";
                db.get(sql, [user.username], async (err : Error, row : any) => {
                    if (err) {
                        return reject(err);
                    }
                    // Devo controllare che il prodotto esista e che abbia quantità > 0 nell'inventario
                    // Altrimenti devo ritornare un errore
                    try {
                        const prod = await productDAO.getProductByModel(product);
                        if(prod[0].quantity == 0)
                            return reject(new EmptyProductStockError)
                    } catch (error) {
                        return reject(error); // returns 404 or 409 errors
                    }

                    if (!row) {
                        // create a new unpaid cart
                        await this.createEmptyCart(user.username);
                        try {
                            await this.addProduct(user, product);
                        } catch (error) {
                            return reject(error);
                        }
                        resolve(true);
                    }
                    
                    try {
                        const productInCart = await this.getProductInCart(row.CartID, product, true); // is the product in the cart?
                        if (productInCart.quantity > 0){
                            // Ho trovato un cartello, aumento di 1 la quantità se è > 0 e ricalcolo il totale
                            await this.increseSingleProduct(row.CartID, product);
                        }else{
                            // La quantità è 0 inserisco il prodotto dal carrello e ricalcolo il totale
                            await this.addSingleProduct(row.CartID, product);
                        }   

                        try {
                            await this.updateCartTotal(row.CartID);
                        } catch (error) {
                            return reject(error);
                        }

                        resolve(true);
                        
                    } catch (error) {
                        return reject(error); // getProductInCart() error
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     * Additional Constraints:
        @returns a 404 error if there is no information about an unpaid cart in the database
        @returns return a 400 error if there is information about an unpaid cart but the cart contains no product
        @returns return a 409 error if there is at least one product in the cart whose available quantity in the stock is 0
        @returns return a 409 error if there is at least one product in the cart whose quantity is higher than the available quantity in the stock
     */
    checkOutCart(user: User): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const findCartSql = "SELECT * FROM cart WHERE customer = ? AND paid = 0";
                db.get(findCartSql, [user.username], async (err: Error, row: any) => {
                    if (err) {
                        return reject(err);
                    }

                    if (!row) {
                        // Nothing is found return an error
                        return reject(new CartNotFoundError); // 404 error no cart
                    }

                    const productsInCart = await this.getAllProductsInCart(row.CartID);

                    // Checks if in the cart there are any products
                    if (!Array.isArray(productsInCart) || !productsInCart.length) {
                        return reject(new EmptyCartError); // 400 error no products
                    }

                    // Checks if product avaiable quantity is enough
                    try {
                        for (let p of productsInCart) { // p is a ProductInCart class object
                            const products = await productDAO.getProductByModel(p.model); // product is a Product class object
                            if (products[0].quantity === 0){
                                return reject(new EmptyProductStockError); // 409 error
                            } else if (products[0].quantity < p.quantity) {
                                return reject(new LowProductStockError); // 409 error
                            }
                        }

                    } catch (error) {
                        return reject(error); // 404 o 409 error product not found (or not enough stock redundant)
                    }

                    // Update the inventory 
                    try{
                        for (let p of productsInCart){
                            await productDAO.sellProduct(p.model, p.quantity, dayjs().format('YYYY-MM-DD'));
                        }
                    }catch(error){
                        reject(error);
                    }

                    const username = row.customer;
                    const CartID = row.CartID;
                    const todayDate = dayjs().format('YYYY-MM-DD');                  

                    const clearCartSql = "UPDATE cart SET paid = 1, paymentDate = ? WHERE customer = ? AND CartID = ?";
                    db.run(clearCartSql, [todayDate, username, CartID], (err: Error) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Returns the user paid carts.
     * @param user The user whose carts we want to be returned
     * @returns A Promise that resolves to the user unpaid carts if are present, nothing otherwise.
     */
    getPaidUserCarts(user: User): Promise<Cart[]> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "SELECT * FROM cart WHERE customer = ? AND paid = 1";
                db.all(sql, [user.username], async (err : Error, rows : any[]) => {
                    if (err) {
                        return reject(err);
                    }
                    const carts: Cart[] = [];
                    if (!rows) {
                        // If there are't any paid carts
                        return resolve(carts);
                    }

                    for (const row of rows) {
                        const products = await this.getAllProductsInCart(row.CartID);
                        const cart = new Cart(row.customer, row.paid === 1, row.paymentDate, row.total, products);
                        carts.push(cart);
                    }

                    resolve(carts);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     * 
     * Additional Constraints:
        @returns a 404 error if model represents a product that is not in the cart
        @returns a 404 error if there is no information about an unpaid cart for the user, or if there is such information but there are no products in the cart
        @returns a 404 error if model does not represent an existing product
     */
    removeProduct(user: User, product: string): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "SELECT * FROM cart WHERE customer = ? AND paid = 0";
                db.get(sql, [user.username], async (err : Error, row : any) => {
                    if (err) {
                        return reject(err);
                    }
    
                    if (!row) {
                        // nessun carrello trovato
                        return reject(new CartNotFoundError) // 404 error
                    }

                    const productsInCart = await this.getAllProductsInCart(row.CartID);

                    // Checks if in the cart there are any products
                    if (!Array.isArray(productsInCart) || !productsInCart.length) {
                        return reject(new ProductNotInCartError); // 404 error no products
                    }
                    
                    // Return error if product does not exist. use function in productDAO
                    try{
                        await productDAO.getProductByModel(product); // Error 404
                    }catch(error){
                        reject(error);
                    }

                    // Return error if product is not in the cart
                    try {
                        const productInCart = await this.getProductInCart(row.CartID, product, false);
                        // console.log(productInCart);
                        if (productInCart.quantity > 1){
                            // Ho trovato un cartello, diminuisco di 1 la quantità se è >1 e ricalcolo il totale
                            await this.decreseSingleProduct(row.CartID, product);
                        }else{
                            // La quantità è 1 rimuovo il prodotto dal carrello e ricalcolo il totale
                            // console.log(row.CartID, product);
                            await this.removeSingleProduct(row.CartID, product);
                        }   
                        await this.updateCartTotal(row.CartID);
                        resolve(true);

                    }catch(error){
                        reject(error); 
                    }

                });
            } catch (e) {
                reject(e);
            }
        });
    }
        
    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     * 
     * Additional Constraints:
        @returns a 404 error if there is no information about an unpaid cart for the user
     */
    clearCart(user: User): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const findCartSql = "SELECT * FROM cart WHERE customer = ? AND paid = 0";
                db.get(findCartSql, [user.username], (err: Error, row: any) => {
                    if (err) {
                        return reject(err);
                    }

                    if (!row) {
                        // No cart is found
                        return reject(new CartNotFoundError);
                    }

                    const cartId = row.CartID;
                    const clearCartSql = "DELETE FROM productInCart WHERE cart = ?";
                    return db.run(clearCartSql, [cartId], (err: Error | null) => {
                        if (err) {
                            //console.log(err.message) // debug purpose
                            return reject(err);
                        }
                        this.updateCartTotal(cartId)
                        resolve(true);
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    deleteAllCarts(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "DELETE FROM cart";
                db.run(sql, (err: Error | null) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(true);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    getAllCarts(): Promise<Cart[]> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "SELECT * FROM cart";
                db.all(sql, async (err : Error, rows : any[]) => {
                    if (err) {
                        return reject(err);
                    }
                    const carts: Cart[] = [];
                    if (!rows || rows.length === 0) {
                        return resolve(carts);
                    }
                    
                    for (const row of rows) {
                        const products = await this.getAllProductsInCart(row.CartID);
                        const cart = new Cart(row.customer, row.paid === 1, row.paymentDate, row.total, products);
                        carts.push(cart);
                    }

                    resolve(carts);
                });
            } catch (e) {
                reject(e);
            }
        });
    }


    // Used only inside cartDAO

    createEmptyCart(userId: string): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                const sql = `INSERT INTO cart (customer, paid, total) VALUES (?, 0, 0)`;
                db.run(sql, [userId], function (err: Error) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(this.lastID); // Restituisce l'ultima chiave primaria creata
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    getAllProductsInCart(CartID: number): Promise<ProductInCart[]> {
        return new Promise<ProductInCart[]>((resolve, reject) => {
            try { 
                //[Nota da GP]: Nella query ho modificato sellingPrice col nome di price perché se no non mi passava il test dato che ProductInCart ha l'attributo price invece che sellingPrice 
                const sql = `
                    SELECT p.model, p.category, pic.quantity, p.sellingPrice as price
                    FROM productInCart AS pic
                    INNER JOIN cart AS c ON pic.cart = c.CartID
                    INNER JOIN product AS p ON pic.model = p.model
                    WHERE pic.cart = ?
                `;
                db.all(sql, [CartID], (err: Error, rows: any[]) => {
                    if (err) {
                        return reject(err);
                    }
                    const productsInCart: ProductInCart[] = rows.map(row => new ProductInCart(
                        row.model,
                        row.quantity,
                        row.category,
                        row.price
                    ));
                    resolve(productsInCart);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    getProductInCart(CartID: number, model: string, add_remove : boolean): Promise<ProductInCart> {
        return new Promise<ProductInCart>((resolve, reject) => {
            try {
                //[Nota da GP]: Nella query ho modificato sellingPrice col nome di price perché se no non mi passava il test dato che ProductInCart ha l'attributo price invece che sellingPrice 
                const sql = `
                    SELECT p.model, p.category, pic.quantity, p.sellingPrice as price
                    FROM productInCart AS pic
                    INNER JOIN cart AS c ON pic.cart = c.CartID
                    INNER JOIN product AS p ON pic.model = p.model
                    WHERE pic.cart = ? and p.model = ?
                `;
                db.get(sql, [CartID, model], (err: Error, row: any) => {
                    if (err) {
                        return reject(err);
                    }

                    if (!row) {
                            if(add_remove) {
                            const productInCart: ProductInCart = new ProductInCart(
                                model,
                                0, // quantity
                                null,
                                0,                        
                            );
                            resolve(productInCart);
                        } else {
                            reject(new ProductNotInCartError)
                        }
                    }else{

                        const productInCart: ProductInCart = new ProductInCart(
                            row.model,
                            row.quantity,
                            row.category,
                            row.price,                        
                        );
                        resolve(productInCart);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    removeSingleProduct(cartId: number, model:string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const clearCartSql = "DELETE FROM productInCart WHERE cart = ? and model = ?";
                    db.run(clearCartSql, [cartId, model], (err: Error) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
            } catch (e) {
                reject(e);
            }
        });
    }
    
    addSingleProduct(cartId: number, model: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const clearCartSql = "INSERT INTO productInCart (cart, model, quantity) VALUES (?, ?, 1)";
                    db.run(clearCartSql, [cartId, model], (err: Error) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
            } catch (e) {
                reject(e);
            }
        });
    }

    decreseSingleProduct(cartId: number, model:string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const clearCartSql = "UPDATE productInCart SET quantity = quantity - 1 WHERE cart = ? AND model = ?";
                    db.run(clearCartSql, [cartId, model], (err: Error) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
            } catch (e) {
                reject(e);
            }
        });
    }

    increseSingleProduct(cartId: number, model:string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const clearCartSql = "UPDATE productInCart SET quantity = quantity + 1 WHERE cart = ? AND model = ?";
                    db.run(clearCartSql, [cartId, model], (err: Error) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
            } catch (e) {
                reject(e);
            }
        });
    }

    updateCartTotal(cartId: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const getProductsSql = `
                    SELECT p.sellingPrice as price, pic.quantity
                    FROM productInCart AS pic
                    INNER JOIN product AS p ON pic.model = p.model
                    WHERE pic.cart = ?
                `;
                db.all(getProductsSql, [cartId], (err: Error, rows: any[]) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    let total = 0;
                    
                    if (rows.length !== 0) {        
                        rows.forEach(row => {
                            total += row.price * row.quantity;
                        });
                    }

                    const updateTotalSql = "UPDATE cart SET total = ? WHERE CartID = ?";
                    db.run(updateTotalSql, [total, cartId], (err: Error) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

}

export default CartDAO