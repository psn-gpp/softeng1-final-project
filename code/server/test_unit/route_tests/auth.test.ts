import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { app } from "../../index";
import { Utility } from "../../src/utilities";
import Authenticator from "../../src/routers/auth";
import UserDAO from "../../src/dao/userDAO";
import { User,Role } from "../../src/components/user";

const LocalStrategy = require('passport-local').Strategy;
// Mock the dependencies
jest.mock("../../src/utilities");
//mock of userDAO
jest.mock("../../src/dao/userDAO");

describe("Auth unit tests", () => {
    let req: any;
    let res: any;
    let next: any;
    let authMiddleware: Authenticator;

    beforeEach(() => {
        req = {
            isAuthenticated: jest.fn(),
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        authMiddleware = new Authenticator(app); // Initialize the middleware here
    });
    //Tests for isManager middleware
    it('should call next if user is authenticated and is a manager', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsManager = jest.spyOn(Utility, 'isManager').mockImplementation((user: any) => {
            return true;
        });
        const result = authMiddleware.isManager(req, res, next);
        expect(next).toHaveBeenCalled();
        mockIsManager.mockRestore();
        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is not authenticated', () => {
        req.isAuthenticated.mockReturnValue(false);
        const result = authMiddleware.isManager(req, res, next);
        expect(next).not.toBeCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is authenticated but not a manager', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsManager = jest.spyOn(Utility, 'isManager').mockImplementation((user: any) => {
            return false;
        });
        const result = authMiddleware.isManager(req, res, next);
        expect(next).not.toBeCalled();
        expect(mockIsManager).toHaveBeenCalledTimes(1)
        expect(res.json).toHaveBeenLastCalledWith({ error: "User is not a manager", status: 401 });
        mockIsManager.mockRestore();
        req.isAuthenticated.mockRestore();
    });
    //Tests for isAdmin middleware
    it('should call next if user is authenticated and is an admin or manager', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsAdmin = jest.spyOn(Utility, 'isAdmin').mockReturnValue(true);
        const mockIsManager = jest.spyOn(Utility, 'isManager').mockReturnValue(false);

        const result = authMiddleware.isAdminOrManager(req, res, next);

        expect(next).toHaveBeenCalled();

        mockIsAdmin.mockRestore();
        mockIsManager.mockRestore();
        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is not authenticated', () => {
        req.isAuthenticated.mockReturnValue(false);

        const result = authMiddleware.isAdminOrManager(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);

        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is authenticated but not an admin or manager', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsAdmin = jest.spyOn(Utility, 'isAdmin').mockReturnValue(false);
        const mockIsManager = jest.spyOn(Utility, 'isManager').mockReturnValue(false);

        const result = authMiddleware.isAdminOrManager(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "User is not an admin or manager", status: 401 });

        mockIsAdmin.mockRestore();
        mockIsManager.mockRestore();
        req.isAuthenticated.mockRestore();
    });
    //Tests for isAdmingOrManager middleware
    it('should call next if user is authenticated and is an admin or manager', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsAdmin = jest.spyOn(Utility, 'isAdmin').mockReturnValue(true);
        const mockIsManager = jest.spyOn(Utility, 'isManager').mockReturnValue(false);

        const result = authMiddleware.isAdminOrManager(req, res, next);

        expect(next).toHaveBeenCalled();

        mockIsAdmin.mockRestore();
        mockIsManager.mockRestore();
        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is not authenticated', () => {
        req.isAuthenticated.mockReturnValue(false);

        const result = authMiddleware.isAdminOrManager(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);

        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is authenticated but not an admin or manager', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsAdmin = jest.spyOn(Utility, 'isAdmin').mockReturnValue(false);
        const mockIsManager = jest.spyOn(Utility, 'isManager').mockReturnValue(false);

        const result = authMiddleware.isAdminOrManager(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "User is not an admin or manager", status: 401 });

        mockIsAdmin.mockRestore();
        mockIsManager.mockRestore();
        req.isAuthenticated.mockRestore();
    });
    //Tests for isCustomer middleware
    it('should call next if user is authenticated and is a customer', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsCustomer = jest.spyOn(Utility, 'isCustomer').mockReturnValue(true);

        const result = authMiddleware.isCustomer(req, res, next);

        expect(next).toHaveBeenCalled();

        mockIsCustomer.mockRestore();
        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is not authenticated', () => {
        req.isAuthenticated.mockReturnValue(false);

        const result = authMiddleware.isCustomer(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);

        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is authenticated but not a customer', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsCustomer = jest.spyOn(Utility, 'isCustomer').mockReturnValue(false);

        const result = authMiddleware.isCustomer(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "User is not a customer", status: 401 });

        mockIsCustomer.mockRestore();
        req.isAuthenticated.mockRestore();
    });
    //Tests for isLoggedIn middleware
    it('should call next if user is authenticated', () => {
        req.isAuthenticated.mockReturnValue(true);

        const result = authMiddleware.isLoggedIn(req, res, next);

        expect(next).toHaveBeenCalled();

        req.isAuthenticated.mockRestore();
    });

    it('should return 401 if user is not authenticated', () => {
        req.isAuthenticated.mockReturnValue(false);

        const result = authMiddleware.isLoggedIn(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthenticated user", status: 401 });

        req.isAuthenticated.mockRestore();
    });

    it('should return done if the user is authenticated', () => {
        const userDAO = new UserDAO();
        const mockIsAuthenticated = jest.spyOn(UserDAO.prototype, 'getIsUserAuthenticated').mockResolvedValueOnce(true);
        const testUser = new User("test", "test", "test", Role.ADMIN, "test", "test");
        const result = authMiddleware.isLoggedIn(req, res, next);
        const mockGetUser = jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(testUser);
        
        
        mockIsAuthenticated.mockClear();
        mockGetUser.mockClear();
    });
    it('should call next if user is authenticated and is an admin', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsAdmin = jest.spyOn(Utility, 'isAdmin').mockReturnValue(true);

        authMiddleware.isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();

        mockIsAdmin.mockRestore();
    });

    it('should return 401 if user is not authenticated', () => {
        req.isAuthenticated.mockReturnValue(false);

        authMiddleware.isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "User is not an admin", status: 401 });
    });

    it('should return 401 if user is authenticated but not an admin', () => {
        req.isAuthenticated.mockReturnValue(true);
        const mockIsAdmin = jest.spyOn(Utility, 'isAdmin').mockReturnValue(false);

        authMiddleware.isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(mockIsAdmin).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "User is not an admin", status: 401 });

        mockIsAdmin.mockRestore();
    });
    
})