import { test, expect, jest, beforeEach } from "@jest/globals";
import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import { User } from "../../src/components/user";
import{Role} from "../../src/components/user";
import { ProductReview } from "../../src/components/review"; // Assuming this is defined elsewhere
jest.mock("../../src/dao/reviewDAO");

beforeEach(() => {
    jest.clearAllMocks();
});

test("It should add a new review", async () => {
    const testModel = "testModel";
    const testUser = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
    const testScore = 5;
    const testComment = "Great product!";
    jest.spyOn(ReviewDAO.prototype, "insertReview").mockResolvedValueOnce(undefined);
    const controller = new ReviewController();

    await controller.addReview(testModel, testUser, testScore, testComment);

    expect(ReviewDAO.prototype.insertReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.insertReview).toHaveBeenCalledWith(testModel, testUser, testScore, testComment);
});

test("It should get all reviews for a product", async () => {
    const testModel = "model";
    

    const testReviews = [
        new ProductReview( 'model',  'user1',  5,  'Great!',  '2023-05-29'),
        new ProductReview('model',  'user2',  5,  'bad!',  '2023-06-29')
    ];
    jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(testReviews);
    const controller = new ReviewController();

    const response = await controller.getProductReviews(testModel);

    expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(testModel);
    expect(response).toEqual(testReviews);
});

test("It should delete a review by a user for a product", async () => {
    const testModel = "testModel";
    const testUser = new User('username', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
    jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(undefined);
    const controller = new ReviewController();

    await controller.deleteReview(testModel, testUser);

    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testModel, testUser);
});

test("It should delete all reviews for a product", async () => {
    const testModel = "testModel";
    jest.spyOn(ReviewDAO.prototype, "deleteAllReviewsForProduct").mockResolvedValueOnce(undefined);
    const controller = new ReviewController();

    await controller.deleteReviewsOfProduct(testModel);

    expect(ReviewDAO.prototype.deleteAllReviewsForProduct).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteAllReviewsForProduct).toHaveBeenCalledWith(testModel);
});

test("It should delete all reviews", async () => {
    jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined);
    const controller = new ReviewController();

    await controller.deleteAllReviews();

    expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
});