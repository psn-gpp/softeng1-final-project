import { test, expect, jest, beforeEach } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import request from 'supertest';
import { describe, it } from "node:test";
import { app } from "../..";
import { User,Role } from "../../src/components/user"
import { DateError } from "../../src/utilities";
import { InvalidUpdateError, UnauthorizedUserError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError";
jest.mock("../../src/dao/userDAO");

beforeEach(() => {
    jest.clearAllMocks();
});


//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters



test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});

test("It should return false", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(false); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
   
    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(false); //Check if the response is false
});
//Tests for getUsers controller
test("It should return an array of users", async () => {
    const testUsers = [
        { username: "test1", name: "Test1", surname: "User1", role: Role.CUSTOMER, address: "...", birthdate: "..." },
        { username: "test2", name: "Test2", surname: "User2", role: Role.MANAGER, address: "...", birthdate: "..." },
        // Add more test users as needed
    ];
    jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers); // Mock the getUsers method of the DAO
    const controller = new UserController(); // Create a new instance of the controller
    // Call the getUsers method of the controller
    const response = await controller.getUsers();
    // Check if the getUsers method of the DAO has been called once
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
    // Check if the response is an array
    expect(Array.isArray(response)).toBe(true);
    // Check if the response contains the test users
    expect(response).toEqual(testUsers);
});

test("It should throw an error if DAO method fails", async () => {
    const errorMessage = "Error fetching users"; // Define an error message
    jest.spyOn(UserDAO.prototype, "getUsers").mockRejectedValueOnce(new Error(errorMessage)); // Mock the getUsers method of the DAO to throw an error
    const controller = new UserController(); // Create a new instance of the controller
    // Call the getUsers method of the controller and expect it to throw an error
    await expect(controller.getUsers()).rejects.toThrow(errorMessage);
    // Check if the getUsers method of the DAO has been called once
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
});

// Tests for getUsersByRole controller
test("It should return an array of users with the specified role", async () => {
    // Define test data
    const testRole = Role.MANAGER;
    const testUsers = [
        { username: "user1", name: "User1", surname: "Surname1", role: testRole, address: "...", birthdate: "..." },
        { username: "user2", name: "User2", surname: "Surname2", role: testRole, address: "...", birthdate: "..." }
    ];

    // Mock the getUsersByRole method of the DAO
    jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(testUsers);

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the getUsersByRole method of the controller with the test role
    const response = await controller.getUsersByRole(testRole);

    // Check if the getUsersByRole method of the DAO has been called once with the test role
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(testRole);

    // Check if the response is an array containing the test users
    expect(Array.isArray(response)).toBe(true);
    expect(response).toEqual(testUsers);
});

test("It should return an empty array if no users with the specified role are found", async () => {
    // Define test data
    const testRole = "NonExistingRole";

    // Mock the getUsersByRole method of the DAO to return an empty array
    jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce([]);

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the getUsersByRole method of the controller with a non-existing role
    const response = await controller.getUsersByRole(testRole);

    // Check if the getUsersByRole method of the DAO has been called once with the test role
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(testRole);

    // Check if the response is an empty array
    expect(Array.isArray(response)).toBe(true);
    expect(response).toEqual([]);
});

// Tests for getUserByUsername controller
test("It should return the user with the specified username for admins", async () => {
    // Define test data
    const testAdminUser = { username: "admin",name: "User1", surname: "Surname1", role: Role.ADMIN,address: "...", birthdate: "..." };
    const testUsername = "user1";
    const testUser = { username: testUsername, name: "User1", surname: "Surname1", role: Role.CUSTOMER, address: "...", birthdate: "..." };

    // Mock the getUserByUsername method of the DAO to return the test user
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the getUserByUsername method of the controller with the test admin user and username
    const response = await controller.getUserByUsername(testAdminUser, testUsername);

    // Check if the getUserByUsername method of the DAO has been called once with the test username
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(testUsername);

    // Check if the response is the test user
    expect(response).toEqual(testUser);
});

test("It should return the user's own information for non-admin users", async () => {
    // Define test data
    const testUser = { username: "user1",name:"prova",surname:"prova", role: Role.CUSTOMER,address:"...",birthdate:"..." };
    const testUsername = "user1";
    const testUserInfo = { username: testUsername, name: "User1", surname: "Surname1", role: Role.CUSTOMER, address: "...", birthdate: "..." };

    // Mock the getUserByUsername method of the DAO to return the test user info
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUserInfo);

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the getUserByUsername method of the controller with the test user and username
    const response = await controller.getUserByUsername(testUser, testUsername);

    // Check if the getUserByUsername method of the DAO has been called once with the test username
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(testUsername);

    // Check if the response is the test user info
    expect(response).toEqual(testUserInfo);
});

test("It should reject with UnauthorizedUserError for non-admin users trying to access other users' information", async () => {
    // Define test data
    const testUser = { username: "user1", name:"prova",surname:"prova", role: Role.CUSTOMER,address:"...",birthdate:"..." };
    const testUsername = "user2";

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the getUserByUsername method of the controller with the test user and another username, expect it to reject with UnauthorizedUserError
    await expect(controller.getUserByUsername(testUser, testUsername)).rejects.toThrow(UnauthorizedUserError);

    // Check if the getUserByUsername method of the DAO has not been called
    expect(UserDAO.prototype.getUserByUsername).not.toHaveBeenCalled();
});


//Tests for deleteUser controller
test("It should reject with UserNotAdminError for non-admin users trying to delete other admin users", async () => {
    // Define test data
    const testUser = {
        username: "user1",
        role: Role.CUSTOMER,
        name: "Test",
        surname: "User",
        birthdate: "1990-01-01",
        address: "Test Address"
    };
    const testAdminUsername = "admin";

    // Mock the getUserByUsername method of the DAO to return a test admin user
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce({
        username: testAdminUsername,
        role: Role.ADMIN,
        name: "Admin",
        surname: "Admin",
        birthdate: "2000-01-01",
        address: "Admin Address"
    });

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the deleteUser method of the controller with the test user and an admin username, expect it to reject with UserNotAdminError
    await expect(controller.deleteUser(testUser, testAdminUsername)).rejects.toThrow(UserNotAdminError);

    // Check if the getUserByUsername method of the DAO has been called once with the test admin username
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);

    // Check if the deleteUser method of the DAO has not been called
    expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
});

test("It should reject with UserNotAdminError for non-admin users trying to delete other users", async () => {
    // Define test data
    const testUser = {
        username: "user1",
        role: Role.CUSTOMER,
        name: "Test",
        surname: "User",
        birthdate: "1990-01-01",
        address: "Test Address"
    };
    const testTargetUsername = "user2";

    // Mock the getUserByUsername method of the DAO to return a test user
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce({
        username: testTargetUsername,
        role: Role.CUSTOMER,
        name: "Test 2",
        surname: "User 2",
        birthdate: "1995-01-01",
        address: "Test Address 2"
    });

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the deleteUser method of the controller with the test user and another user's username, expect it to reject with UserNotAdminError
    await expect(controller.deleteUser(testUser, testTargetUsername)).rejects.toThrow(UserNotAdminError);

    // Check if the getUserByUsername method of the DAO has been called once with the test target username
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);

    // Check if the deleteUser method of the DAO has not been called
    expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
});

test("It should return with true", async () => {
    // Define test data
    const testUser = {
        username: "user1",
        role: Role.CUSTOMER,
        name: "Test",
        surname: "User",
        birthdate: "1990-01-01",
        address: "Test Address"
    };
    const testTargetUsername = "user1";

    // Mock the getUserByUsername method of the DAO to return a test user
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce({
        username: testTargetUsername,
        role: Role.CUSTOMER,
        name: "Test",
        surname: "User",
        birthdate: "1999-01-01",
        address: "Test Address"
    });

    // Create a new instance of the controller
    const controller = new UserController();
    jest.spyOn(UserDAO.prototype,"deleteUser").mockResolvedValueOnce(true);
    // Call the deleteUser method of the controller with the test user and another user's username, expect it to reject with UserNotAdminError
    const response = await controller.deleteUser(testUser, testTargetUsername);
    //I expect the response to be true
    expect(response).toBe(true);
    // Check if the getUserByUsername method of the DAO has been called once with the test target username
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(testTargetUsername);

    // Check if the deleteUser method of the DAO has not been called
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
});

test("Admin can delete non-admin user", async () => {
    // Define test data
    const adminUser = {
        username: "admin",
        name: "prova",
        surname: "prova",
        role: Role.ADMIN,
        address: "...",
        birthdate: "..."
    };
    const nonAdminUserToDelete = {
        username: "nonadmin",
        name: "prova2",
        surname: "prova2",
        role: Role.CUSTOMER,
        address: "...",
        birthdate: "..."
    };

    // Mock the getUserByUsername method of the DAO to return the non-admin user
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(nonAdminUserToDelete);
    jest.spyOn(UserDAO.prototype,"deleteUser").mockResolvedValueOnce(true);
    // Create a new instance of the controller
    const controller = new UserController();

    // Call the deleteUser method of the controller with the admin user and the username of the non-admin user
    const result = await controller.deleteUser(adminUser, nonAdminUserToDelete.username);

    // Check if the deleteUser method of the DAO has been called with the correct username
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(nonAdminUserToDelete.username);
    // Check if the result is true indicating successful deletion
    expect(result).toBe(true);
});



test("Admin can delete all non-Admin users", async () => {
    
    // Mock the deleteAll method of the DAO
    jest.spyOn(UserDAO.prototype, "deleteALL").mockResolvedValueOnce(true);

    // Create a new instance of the controller
    const controller = new UserController();

    // Call the deleteAll method of the controller with the admin user
    const result = await controller.deleteAll();

    // Check if the deleteAll method of the DAO has been called
    expect(UserDAO.prototype.deleteALL).toHaveBeenCalledTimes(1);
    // Check if the result is true indicating successful deletion
    expect(result).toBe(true);
});


//tests of updateUserInfo controller
const createUser = (username: string, role: Role) => ({
    username,
    role,
    name: "Test",
    surname: "User",
    address: "Test Address",
    birthdate: "1990-01-01"
});

// Test: User updates their own information
test("User updates their own information", async () => {
    // Create a test user
    const user = createUser("testUser", Role.CUSTOMER);
    const updatedUser = new User("testUser", "NewName", "NewSurname",Role.CUSTOMER, "NewAddress", "1990-01-01");
    // Mock of getUserByUsername function to make her return test user
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user);
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);

    // Crea un'istanza del controller
    const controller = new UserController();

    //Verify if details have been updated correctly
    const newUser = await controller.updateUserInfo(user, "NewName", "NewSurname", "NewAddress", "1990-01-01", "testUser");
    
    expect(newUser.name).toBe(updatedUser.name);
    expect(newUser.surname).toBe(updatedUser.surname);
    expect(newUser.address).toBe(updatedUser.address);

    //Restore the behaviour of mocked functions
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRestore();
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRestore();
});

// Test: Admin updates another user's information
test("Admin updates another user's information", async () => {
    // Create users
    const admin = createUser("adminUser", Role.ADMIN);
    const userToUpdate = createUser("userToUpdate", Role.CUSTOMER);
    const newUser = new User("userToUpdate", "NewName", "NewSurname", Role.CUSTOMER, "NewAddress", "1990-01-01")
    // Mock della funzione getUserByUsername per farla restituire l'utente da aggiornare
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(userToUpdate);
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(newUser);
    // Crea un'istanza del controller
    const controller = new UserController();

    // Aggiorna le informazioni dell'utente da aggiornare come utente amministratore e verifica se i dettagli sono stati aggiornati correttamente
    const updatedUser = await controller.updateUserInfo(admin, "NewName", "NewSurname", "NewAddress", "1990-01-01", "userToUpdate");
    expect(updatedUser.name).toBe(newUser.name);
    expect(updatedUser.surname).toBe(newUser.surname);
    expect(updatedUser.address).toBe(newUser.address);

    // Ripristina il comportamento originale della funzione getUserByUsername
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRestore();
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRestore();
});

// Test: Admin tries to update the info of another admin
test("Admin updates their own information", async () => {
    // Crea un utente amministratore
    const admin = createUser("adminUser", Role.ADMIN);
    const otherAdmin = createUser("otherAdmin", Role.ADMIN);
    // Mock della funzione getUserByUsername per farla restituire l'utente amministratore
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(otherAdmin);
    // Crea un'istanza del controller
    const controller = new UserController();
    //expect an error if an admin tries to update info of another admin

    await expect(controller.updateUserInfo(admin, "NewName", "NewSurname", "NewAddress", "1990-01-01", "otherAdmin")).rejects.toThrow(UserIsAdminError);

    // Ripristina il comportamento originale della funzione getUserByUsername
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRestore();
});

// Test: User attempts to update another user's information
test("User attempts to update another user's information", async () => {
    // Crea un utente e un utente da aggiornare
    const user = createUser("testUser", Role.CUSTOMER);
    const userToUpdate = createUser("userToUpdate", Role.CUSTOMER);
    // Mock della funzione getUserByUsername per farla restituire l'utente da aggiornare
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(userToUpdate);
    // Crea un'istanza del controller
    const controller = new UserController();

    // Verifica se un utente non può aggiornare le informazioni di un altro utente e si aspetta un errore di autorizzazione
    await expect(controller.updateUserInfo(user, "NewName", "NewSurname", "NewAddress", "1990-01-01", "userToUpdate")).rejects.toThrow(UserNotAdminError);

    // Ripristina il comportamento originale della funzione getUserByUsername
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRestore();
});

//The date is after the current date
test("It should throw an error if the birthdate is after the current date", async () => {
    const admin = createUser("adminUser", Role.ADMIN);
    const controller = new UserController();

    // Aggiorna le informazioni dell'utente amministratore e verifica se i dettagli sono stati aggiornati correttamente
    await expect(controller.updateUserInfo(admin, "NewName", "NewSurname", "NewAddress", "2027-01-01", "adminUser")).rejects.toThrow(DateError);
 
});



//An admin tries to update its own information
test("Admin updates their own information", async () => {
    // Crea un utente amministratore
    const admin = createUser("adminUser", Role.ADMIN);
    const updatedAdmin = new User("adminUser", "NewName", "NewSurname", Role.ADMIN, "NewAddress", "1990-01-01");
    // Mock della funzione getUserByUsername per farla restituire l'utente amministratore
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(admin);
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(updatedAdmin);

    // Crea un'istanza del controller
    const controller = new UserController();

    // Aggiorna le informazioni dell'utente amministratore e verifica se i dettagli sono stati aggiornati correttamente
    const newUser = await controller.updateUserInfo(admin, "NewName", "NewSurname", "NewAddress", "1990-01-01", "adminUser");
    expect(newUser.name).toBe(updatedAdmin.name);
    expect(newUser.surname).toBe(updatedAdmin.surname);
    expect(newUser.address).toBe(updatedAdmin.address);

    // Ripristina il comportamento originale della funzione getUserByUsername
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRestore();
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRestore();
});

