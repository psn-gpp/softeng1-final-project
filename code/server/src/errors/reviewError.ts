const EXISTING_REVIEW = "You have already reviewed this product"
const NO_REVIEW = "You have not reviewed this product"
const NO_MODEL = "There's not an existing product with the model specified"
class ExistingReviewError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EXISTING_REVIEW
        this.customCode = 409
    }
}

class NoReviewProductError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = NO_REVIEW
        this.customCode = 404
    }
}
//It should return a 404 error if `model` does not represent an existing product in the database
class NoExistingProductError extends Error{
    customMessage: string
    customCode:number
    constructor(){
        super()
        this.customMessage = NO_MODEL
        this.customCode = 404
    }
}
export { ExistingReviewError, NoReviewProductError, NoExistingProductError }