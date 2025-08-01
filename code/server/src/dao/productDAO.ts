import db from "../db/db";
import { Category, Product } from "../components/product";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, ArrivalDateError} from "../errors/productError";
import dayjs from 'dayjs';

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

/* The table operationsProduct includes all operations involving products' table changes. The operationID's field is the primary key and it is incremental, while the "type" field can contain 4 different types of operation:
    "register" -> Registration of new product. Arguments: model, quantity, registration date.
    "quantity" -> Change of product quantity. Arguments: model, new quantity, change date.
    "sell" -> Sale of product. Arguments: sold model, sold quantity of that model, selling date.
    "delete" -> Cancellation of product. Arguments: deleted product, cancellation date.
    ""
*/

    registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null) :Promise<void>  { 
        return new Promise<void>((resolve, reject) => {
            try {
                const sqlCheck = "SELECT * FROM product WHERE model = ?"
                db.get(sqlCheck, [model], (err, row) => {
                    if(row)
                        return reject(new ProductAlreadyExistsError)
                })

                const sql = "INSERT INTO product(model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?,?,?,?,?,?)" 
                db.run(sql, [model, category, quantity, !details ? "" : details, sellingPrice, !arrivalDate ? "" : arrivalDate], (err: Error | null) => {
                    if(err) 
                        return reject(err)
                    else {
                        /*const sql = "INSERT INTO operationsProduct(type,model, quantity, date) VALUES (?, ?, ?, ?)"
                        db.run(sql,["register", model, quantity, arrivalDate], (err : Error | null) => {if(err) return reject(err)})*/
                        resolve()
                    }
                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    changeProductQuantity(model: string, newQuantity: number, changeDate: string | null) :Promise<number>  {
        return new Promise<number>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE model = ?"
                db.get(sql, [model], (err : Error | null, row: any) => {
                    if(err)
                        return reject(err)
                    if(!row || row.model !== model) {
                        return reject(new ProductNotFoundError)
                    }
                    if(dayjs(changeDate).isBefore(dayjs(row.arrivalDate)))
                        return reject(new ArrivalDateError);

                    const sql = "UPDATE product SET quantity = quantity + ? WHERE model = ?"
                    const total = row.quantity + newQuantity;
                    db.run(sql,[newQuantity, model], (err : Error | null)  => {
                        if(err)
                            return reject(err)
                        else {/*
                            const sql = "INSERT INTO operationsProduct(type,model, quantity, date) VALUES (?, ?, ?, ?)"
                            db.run(sql,["quantity", model, newQuantity, changeDate], (err : Error | null) => {if(err) return reject(err)})*/
                            resolve(total)
                        }
                    })

                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    sellProduct(model: string, quantity: number, sellingDate: string | null) :Promise<number>  {
        return new Promise<number> ((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE model = ?"
                db.get(sql, [model], (err : Error | null, row: any) => {
                    if(err)
                        return reject(err)
                    if(!row || row.model !== model)
                        return reject(new ProductNotFoundError)
                    if(row.quantity == 0)
                        return reject(new EmptyProductStockError)
                    if(dayjs(sellingDate).isBefore(dayjs(row.arrivalDate)))
                        return reject(new ArrivalDateError);

                    const newTotal = row.quantity - quantity

                    if(newTotal < 0)
                        return reject(new LowProductStockError)
                    
                    const sql = "UPDATE product SET quantity = ? WHERE model = ?"
                    db.run(sql, [newTotal, model], (err : Error | null) => {
                        if(err)
                            return reject(err)
                        else {/*
                            const sql = "INSERT INTO operationsProduct(type,model, quantity, date) VALUES (?, ?, ?, ?)"
                            db.run(sql,["sell", model, quantity, sellingDate], (err : Error | null) => {if(err) return reject(err)})*/
                            resolve(newTotal)
                        }
                    })
                })
            } catch(e) {
                return reject(e)
            }
        })
     }

     getAllProducts() : Promise<Product[]> { 
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product"
                db.all(sql, (err : Error, rows : any[]) => {
                    if(err)
                        return reject(err)

                    const products = rows.map((row : any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))

                    resolve(products)
                })
            } catch(e) {
                return reject(e)
            }
        })
     }


     getProductsByCategory(category: string) : Promise<Product[]> { 
        return new Promise<Product[]>((resolve, reject) => {
            
            if(category && category !== Category.APPLIANCE && category !== Category.LAPTOP && category !== Category.SMARTPHONE)
                return reject();

            try {
                const sql = "SELECT * FROM product WHERE category = ?"
                db.all(sql, [category], (err : Error | null, rows : any[]) => {
                    if(err)
                        return reject(err)

                    const products = rows.map((row : any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))

                    resolve(products)
                })
            } catch (e) {
                return reject(e)
            }
        })
     }

     getProductByModel(model: string) : Promise<Product[]> { 
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE model = ?"
                db.all(sql, [model], (err : Error, rows : any[]) => {
                    if(err)
                        return reject(err)

                    if(rows.length === 0)
                        return reject(new ProductNotFoundError);

                    const products = rows.map((row) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                    
                    resolve(products)
                })
            } catch(e) {
                return reject(e)
            }
        })
     }

     deleteProduct(model: string | null) : Promise <Boolean> { 
        return new Promise<Boolean>((resolve, reject) => {
             try {
                if (!model) {
                    const sql = "DELETE FROM product"
                    db.run(sql, [] ,(err: Error | null) => {
                        if(err) {
                            return reject(err)
                        }
                        else {
                            /*products.then((products) => products.forEach((product) => {
                                const sql = "INSERT INTO operationsProduct(type,model, date) VALUES (?, ?, ?)"
                                db.run(sql,["delete", product.model, dayjs().format('YYYY-MM-DD').toString()], function (err : Error | null) {
                                    if(err) 
                                        return reject(err)
                                    else 
                                        resolve(true)
                                })
                            }))*/
                            return resolve(true)
                        }
                    })
                } else {
                    const sqlCheck = "SELECT * FROM product WHERE model = ?"
                    db.get(sqlCheck, [model], (err : Error | null, row: any) => {
                        if(err)
                            return reject(err)
                        if(!row || row.model !== model)
                            return reject(new ProductNotFoundError)
                    })
                    
                    const sql = "DELETE FROM product WHERE model = ?"
                    db.run(sql, [model], (err: Error | null) => {
                        if(err)
                            return reject(err)
                        else {/*
                            
                            products.then((products) => {
                                products.forEach((prod) => {
                                    const sql = "INSERT INTO operationsProduct(type,model, date) VALUES (?, ?, ?)"
                                    db.run(sql,["delete", prod.model, dayjs().format('YYYY-MM-DD').toString()], function (err : Error | null) {
                                        if(err) 
                                            return reject(err)
                                        else 
                                            resolve(true)
                                    })
                                })
                            })*/
                            return resolve(true)
                        }
                    })
                }  
            } catch(e) {
                return reject(e)
            }

        })
    }

}

export default ProductDAO