import { describe, test, expect, jest } from '@jest/globals';
import  ReviewDAO  from '../../src/dao/reviewDAO';
import ProductDAO from '../../src/dao/productDAO';
import { Product} from '../../src/components/product';
import db from '../../src/db/db';
import { ProductReview } from '../../src/components/review';
import { User } from '../../src/components/user';
import { Role } from '../../src/components/user';
import { ExistingReviewError, NoReviewProductError, NoExistingProductError } from '../../src/errors/reviewError';
import dayjs from 'dayjs';
import { Database } from "sqlite3"
import {Category} from '../../src/components/product';
jest.mock('../../src/db/db');
const prod = [new Product(200, 'model', Category.LAPTOP, '01/01/2001', 'optional', 1)];
const productDAO = new ProductDAO();
// Tests for insertReview method
describe('ReviewDAO - insertReview', () => {
    test('should reject with ExistingReviewError if review already exists', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, { user: 'username', model: 'model' });
                
            }
            return {} as Database

        });

        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');

        await expect(reviewDAO.insertReview('model', user, 5, 'Great product!')).rejects.toThrow(ExistingReviewError);
        mockDBGet.mockRestore();
    });

    test('should reject with NoExistingProductError if product does not exist', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, null);
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, null);
            }
            return {} as Database
        });

        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');

        await expect(reviewDAO.insertReview('nonexistent_model', user, 5, 'Great product!')).rejects.toThrow(NoExistingProductError);
        mockDBGet.mockRestore();
    });

    test('should resolve if review is successfully inserted', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, null);
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { model: 'model' });
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.insertReview('model', user, 5, 'Great product!')).resolves.toBeUndefined();

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test('should reject with an error if database Getquery fails', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {



            if (sql.includes('SELECT * FROM review')) {
                callback(new Error('Database error in review query'), null);
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { sellingPrice: 200 ,
                    model: 'model' ,
                    category: Category.LAPTOP ,
                    arrivalDate: '01/01/2001' ,
                    details: 'optional' ,
                    quantity: 1 
                    });
            }
            return {} as Database;
        });


        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.insertReview('model', user, 5, 'Great product!')).rejects.toThrow('Database error in review query');
        mockDBGet.mockRestore();
    });

    test('should reject with an error if the second db.get query fails', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, null);
            } else if (sql.includes('SELECT * FROM product')) {
                callback(new Error('Database error in product query'), null);
            }
            return {} as Database;
        });

        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.insertReview('model', user, 5, 'Great product!')).rejects.toThrow('Database error in product query');

        mockDBGet.mockRestore();
    });





    test('should reject with an error if an exception occurs in the db.run ', async () => {
        const reviewDAO = new ReviewDAO();
        const user = new User('username', 'name', 'surname',Role.CUSTOMER, 'address', 'birthdate');

        // Mock db.get to simulate normal operation for the first two queries
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, null); // No existing review
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { sellingPrice: 200 ,
                    model: 'model' ,
                    category: Category.LAPTOP ,
                    arrivalDate: '01/01/2001' ,
                    details: 'optional' ,
                    quantity: 1 
                    }); // Product exists
            }
            return {} as Database
        });

        // Mock db.run to throw an error
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
           callback(new Error('database error in run query'), null); 
           return {} as Database ;
        });

        await expect(reviewDAO.insertReview('model', user, 5, 'Great product!')).rejects.toThrow('database error in run query');

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });



    

    test('should reject with an error if an exception occurs in the try block run', async () => {
        const reviewDao = new ReviewDAO();

        const mockDBget1=jest.spyOn(db,'get').mockImplementation((sql, params, callback)=>{
            if (sql.includes('SELECT * FROM review')) {
                callback(null, null); // No existing review
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { model:'model' }); // Product exists
            }
            return {} as Database
        });
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            throw new Error('Unexpected error occurred');
        });
        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        
        await expect(reviewDao.insertReview('model', user, 5, 'Great product!')).rejects.toThrow('Unexpected error occurred');
        
        mockDBRun.mockRestore();
    }, 10000);
    });



// Tests for getProductReviews method
describe('ReviewDAO - getProductReviews', () => {
    test('should resolve with an array of ProductReview objects if the query is successful', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            const rows = [
                { model: 'model', user: 'user1', score: 5, comment: 'Great!', date: '2023-05-29' },
                { model: 'model', user: 'user2', score: 4, comment: 'Good', date: '2023-05-30' },
            ];
            callback(null, rows);
            return {} as Database
        });

        const getProductByModel = jest.spyOn(productDAO, 'getProductByModel').mockResolvedValue(prod);
        const result = await reviewDAO.getProductReviews('model');
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(ProductReview);
        expect(result[1]).toBeInstanceOf(ProductReview);
        mockDBAll.mockRestore();
    });


    test('should reject with an error if the query fails', async () => {
        const reviewDAO = new ReviewDAO();
        const getProductByModel = jest.spyOn(productDAO, 'getProductByModel').mockResolvedValue([]);
        const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'));
            return {} as Database
        });
        await expect(reviewDAO.getProductReviews('model')).rejects.toThrow('Database error');
        mockDBAll.mockRestore();
    });

    test('should reject with an error if an exception occurs in try block', async () => {
         const reviewDao = new ReviewDAO();
         const getProductByModel = jest.spyOn(productDAO, 'getProductByModel').mockResolvedValue([]);
         const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            throw new Error('Unexpected error occurred');
        });
        //const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDao.getProductReviews('model')).rejects.toThrow('Unexpected error occurred');
        getProductByModel.mockRestore();
        mockDBAll.mockRestore();
    })



   
  
    
    
});

// Tests for deleteReview method
describe('ReviewDAO - deleteReview', () => {  
    test('should reject with NoReviewProductError if the user has no review for the product', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, null);
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { model: 'model' });

            }
            return {} as Database
        });

        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.deleteReview('model', user)).rejects.toThrow(NoReviewProductError);
        mockDBGet.mockRestore();
    });

    test('should reject with NoExistingProductError if the product does not exist', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, { user: 'username', model: 'model' });
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, null);
            }
            return {} as Database
        });

        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.deleteReview('nonexistent_model', user)).rejects.toThrow(NoExistingProductError);
        mockDBGet.mockRestore();
    });

    test('should resolve if review is successfully deleted', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, { user: 'username', model: 'model' });
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { model: 'model' });
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.deleteReview('model', user)).resolves.toBeUndefined();
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test('should reject with an error if the deletion query fails', async () => {
        const reviewDAO = new ReviewDAO();
        
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, { model: 'model', user: 'user', score: 4, date: '01/03/2009', comment: 'great!!' });
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { sellingPrice: 200, model: 'model', category: Category.LAPTOP, arrivalDate: '01/01/2001', details: 'optional', quantity: 1 });
            }
            return {} as Database;
        });
        
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'));
            return {} as Database;
        });
    
        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.deleteReview('model', user)).rejects.toThrow('Database error');
        
        expect(mockDBRun).toHaveBeenCalled();
    
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });
    

    test('should reject with an error if the first db.get query fails', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(new Error('Database error in review query'), null);
            } else if (sql.includes('SELECT * FROM product')) {
                callback(null, { model: 'model' });
            }
            return {} as Database;
        });
    
        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.deleteReview('model', user)).rejects.toThrow('Database error in review query');
        mockDBGet.mockRestore();
    });


    test('should reject with an error if the second db.get query fails', async () => {
        const reviewDAO = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM review')) {
                callback(null, { model: 'model', user: 'user', score: 4, date: '01/03/2009', comment: 'great!!' });
            } else if (sql.includes('SELECT * FROM product')) {
                callback(new Error('Database error in product query'), null);
            }
            return {} as Database;
        });
    
        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDAO.deleteReview('model', user)).rejects.toThrow('Database error in product query');
        mockDBGet.mockRestore();
    });


    test('should reject with an error if an exception occurs in the try block get', async () => {
        const reviewDao = new ReviewDAO();
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
          throw new Error('Unexpected error occurred');
        });
        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        await expect(reviewDao.deleteReview('model', user)).rejects.toThrow('Unexpected error occurred');
    
        mockDBGet.mockRestore();
      });



      test('should reject with an error if an exception occurs in the try block run', async () => {
        const reviewDao = new ReviewDAO();
    
        // Mocking db.get and db.run to throw an error
        const mockDBGet = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
            callback(new Error('Unexpected error occurred'));
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
            callback(new Error('Unexpected error occurred'));
            return {} as Database;
        });
    
        const user = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
        
        await expect(reviewDao.insertReview('model', user, 5, 'Great product!')).rejects.toThrow('Unexpected error occurred');
    
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    }, 10000);// Increase the timeout to 10000 milliseconds
    




    

    



describe('ReviewDAO', () => {
    describe('deleteAllReviewsForProduct', () => {
        test('should delete all reviews for an existing product', async () => {
            const model = "model";
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, {sellingPrice: 200 ,
                    model: 'model' ,
                    category: Category.LAPTOP ,
                    arrivalDate: '01/01/2001' ,
                    details: 'optional' ,
                    quantity: 1  });
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database
            });

            await reviewDAO.deleteAllReviewsForProduct(model);

            expect(mockDBGet).toHaveBeenCalled();
            expect(mockDBRun).toHaveBeenCalled();

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test('should reject with NoExistingProductError for a non-existing product', async () => {
            const model = "non_existing_model";
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, null); // Simulating non-existing product
                return {} as any;
            });

            await expect(reviewDAO.deleteAllReviewsForProduct(model)).rejects.toThrow(NoExistingProductError);

            expect(mockDBGet).toHaveBeenCalled();

            mockDBGet.mockRestore();
        });

        test('should reject with an error if database get query fails', async () => {
            const model = "existing_model";
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error in db.get'), null);
                return {} as Database;
            });
        
            await expect(reviewDAO.deleteAllReviewsForProduct(model)).rejects.toThrow('Database error in db.get');
        
            expect(mockDBGet).toHaveBeenCalled();
        
            mockDBGet.mockRestore();
        });
        


        test('should reject with an error if database deletion query fails',async () =>{
            const model = "existing_model";
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null , {sellingPrice: 200 ,
                    model: 'model' ,
                    category: Category.LAPTOP ,
                    arrivalDate: '01/01/2001' ,
                    details: 'optional' ,
                    quantity: 1 } );
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error in db.run'));
                return {} as Database
            });
            await expect(reviewDAO.deleteAllReviewsForProduct(model)).rejects.toThrow('Database error in db.run');
            expect(mockDBRun).toHaveBeenCalled();	
            mockDBRun.mockRestore();



        })




        test('should reject with an error if an exception occurs in the db.run', async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
              if (sql.includes('SELECT * FROM product')) {
                callback(null, { model: 'model' });
              }
              return {} as Database;
            });
        
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
              throw new Error('Unexpected error occurred in db.run');
            });
        
            await expect(reviewDAO.deleteAllReviewsForProduct('model')).rejects.toThrow('Unexpected error occurred in db.run');
        
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
          });





          test('should reject with an error if an exception occurs in the try block get', async () => {
            const reviewDao = new ReviewDAO();
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
              throw new Error('Unexpected error occurred');
            });
            await expect(reviewDao.deleteAllReviewsForProduct('model')).rejects.toThrow('Unexpected error occurred');
        
            mockDBGet.mockRestore();
          });





    });

    describe('deleteAllReviews', () => {
        test('should delete all reviews', async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database
            });

            await reviewDAO.deleteAllReviews();

            expect(mockDBRun).toHaveBeenCalled();

            mockDBRun.mockRestore();
        });

        test('should reject with an error if database query fails', async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database
            });

            await expect(reviewDAO.deleteAllReviews()).rejects.toThrow('Database error');

            expect(mockDBRun).toHaveBeenCalled();

            mockDBRun.mockRestore();
        });


        test('should reject with an error if an exception occurs in the try block', async () => {
            const reviewDAO = new ReviewDAO();
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                throw new Error('Database error');
                return {} as Database
            });
            await expect(reviewDAO.deleteAllReviews()).rejects.toThrow('Database error');
            mockDBRun.mockRestore();

        })




    });
});


})
