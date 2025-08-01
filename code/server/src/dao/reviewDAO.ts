import db from "../db/db";
import {ProductReview} from "../components/review";
import { ExistingReviewError, NoReviewProductError, NoExistingProductError } from "../errors/reviewError"; 
import dayjs from 'dayjs';
import { User } from "../components/user";
import productDAO from "./productDAO";

const productDao = new productDAO();
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    insertReview(model: string, user: User, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql1 = "SELECT * FROM review WHERE user = ? AND model = ?";
                db.get(sql1, [user.username, model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (row) {
                        reject(new ExistingReviewError());
                        return;
                    }
    
                    const sql2 = "SELECT * FROM product WHERE model = ?";
                    db.get(sql2, [model], (err: Error | null, row: any) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (!row) {
                            reject(new NoExistingProductError());
                            return;
                        }
    
                        const today = dayjs().format('YYYY-MM-DD');
                        const review: ProductReview = new ProductReview(model, user.username, score, today, comment);
                        const sqlInsert = 'INSERT INTO review (model, user, score, comment, date) VALUES (?, ?, ?, ?, ?)';
                        db.run(sqlInsert, [review.model, review.user, review.score, review.comment, review.date], function (err) {
                            if (err) {
                              ////  console.error("Error inserting");
                                reject(err);
                                return;
                            }
                            resolve(); // this.lastID contains the id of the last inserted row
                        });
                    });
                });
            } catch (error) {
              //  console.error("Error catch")
                reject(error);
            }
        });
    }
    
    //A function which returns a promise that resolves to an array of ProductReview objects
    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            productDao.getProductByModel(model).then((product) => {
                try {
                    const sql = "SELECT * FROM review WHERE model = ?"
                    db.all(sql, [model], (err: Error | null, rows: any[]) => {
                        if (err) {
                           // console.error("review doesn't exist in db")
                            reject(err)
                            return
                        }
                        const reviews: ProductReview[] = rows? rows.map((row) => {
                            return new ProductReview(row.model, row.user, row.score, row.date, row.comment)  
                        }) : [];
                        resolve(reviews)
                    })
                } catch (error) {
                  //  console.error("catch err");
                    reject(error)
                }

            }).catch((error) => {
                reject(error)
            })
            
        })
    }
    //A function which deletes the review made by a user for a product and resolves to nothing
    //It should return a NoExistingProductError() error if model does not represent an existing product in the database
    //It should return a NoReviewProductError()  error if the current user does not have a review for the product identified by model
    deleteReview(model: string, user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql1 = "SELECT * FROM review WHERE user = ? AND model = ?";
            db.get(sql1, [user.username, model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new NoReviewProductError());
                    return;
                }
    
                const sql2 = "SELECT * FROM product WHERE model = ?";
                db.get(sql2, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new NoExistingProductError());
                        return;
                    }
    
                    const sqlDelete = "DELETE FROM review WHERE model = ? AND user = ?";
                    db.run(sqlDelete, [model, user.username], (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            });
        });
    }
    
    
    //A function which deletes all reviews for a product and resolves to nothing
    //It should return a NoReviewProductError() error if model does not represent an existing product in the database
    deleteAllReviewsForProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM product WHERE model = ?";
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new NoExistingProductError());
                        return;
                    }
    
                    const sql2 = "DELETE FROM review WHERE model = ?";
                    db.run(sql2, [model], (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    //A function which deletes all reviews of all products and resolves to nothing
    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM review"
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }



}

export default ReviewDAO;