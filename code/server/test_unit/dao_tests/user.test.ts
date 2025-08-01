import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO";
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"
import { beforeEach, mock } from "node:test"
import { User,Role } from "../../src/components/user"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")



//Tests for getIsUserAuthenticated
test('should reject with an error if the database query fails', async () => {
    const userDAO = new UserDAO()
    const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        callback(new Error('Database error'), null);
        return {} as Database
    });

    await expect(userDAO.getIsUserAuthenticated('username', 'plainPassword')).rejects.toThrow('Database error');
    expect(mockDBGet).toHaveBeenCalledTimes(1);
    mockDBGet.mockClear();
});

test('should resolve false if no user is found', async () => {
    const userDAO = new UserDAO()
    const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        callback(null, null);
        return {} as Database
    });

    const result = await userDAO.getIsUserAuthenticated('username', 'plainPassword');
    expect(result).toBe(false);
    expect(mockDBGet).toHaveBeenCalledTimes(1);
    mockDBGet.mockClear();
});

test('should resolve false if password does not match', async () => {
    const userDAO = new UserDAO()
    const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        callback(null, { username: 'username', password: 'hashedPassword', salt: 'salt' });
        return {} as Database
    });
    const mockScryptSync = jest.spyOn(crypto, 'scryptSync').mockReturnValue(Buffer.from('wrongHashedPassword'));
    const mockTimingSafeEqual = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(false);

    const result = await userDAO.getIsUserAuthenticated('username', 'plainPassword');
    expect(result).toBe(false);
    expect(mockDBGet).toHaveBeenCalledTimes(1);
    expect(mockScryptSync).toHaveBeenCalledTimes(1);
    expect(mockTimingSafeEqual).toHaveBeenCalledTimes(1);
    mockDBGet.mockClear();
    mockScryptSync.mockClear();
    mockTimingSafeEqual.mockClear();
});
test('should resolve true if password matches', async () => {
    const userDAO = new UserDAO()
    const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        callback(null, { username: 'username', password: 'hashedPassword', salt: 'salt' });
        return {} as Database
    });
    const mockScryptSync = jest.spyOn(crypto, 'scryptSync').mockReturnValue(Buffer.from('hashedPassword'));
    const mockTimingSafeEqual = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);

    const result = await userDAO.getIsUserAuthenticated('username', 'plainPassword');
    expect(result).toBe(true);
    expect(mockDBGet).toHaveBeenCalledTimes(1);
    expect(mockScryptSync).toHaveBeenCalledTimes(1);
    expect(mockTimingSafeEqual).toHaveBeenCalledTimes(1);
    mockDBGet.mockClear();
    mockScryptSync.mockClear();
    mockTimingSafeEqual.mockClear();
});

test('should reject with an error if unable to connect to the database', async () => {
    const userDAO = new UserDAO();

    // Mock di db.get per simulare un errore di connessione al database
    const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        // Simuliamo un errore di connessione al database
        throw new Error('Unable to connect to the database');
    });

    // Utilizziamo un mock per la funzione 'reject' per verificare se viene chiamata correttamente nel blocco 'catch'
    const rejectMock = jest.fn();

    // Aggiungiamo un blocco 'catch' al test per controllare se viene eseguito correttamente
    try {
        await userDAO.getIsUserAuthenticated('username', 'plainPassword');
    } catch (error) {
        // Verifichiamo se il blocco 'catch' viene eseguito correttamente
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Unable to connect to the database');
        // Verifichiamo che la funzione 'reject' sia stata chiamata correttamente
        rejectMock(error);
    }

    // Verifichiamo che la funzione 'reject' sia stata chiamata nel blocco 'catch'
    expect(rejectMock).toHaveBeenCalled();
    expect(mockDBGet).toHaveBeenCalledTimes(1);
    mockDBGet.mockClear();
});





//Tests for createUser method

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const result = await userDAO.createUser("username", "name", "surname", "password", "role")
    expect(result).toBe(true)
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
})


test("It should reject with UserAlreadyExistsError when username is duplicate", async () => {
    const userDAO = new UserDAO();
    // Mock del metodo db.run per simulare un errore di violazione di unicità
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        const error = new Error("UNIQUE constraint failed: users.username");
        callback(error);
        return {} as Database;
    });
    // Mock di crypto.randomBytes e crypto.scryptSync
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation(() => {
        return Buffer.from("salt");
    });
    const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation(() => {
        return Buffer.from("hashedPassword");
    });

    try {
        await userDAO.createUser("username", "name", "surname", "password", "role");
    } catch (error) {
        expect(error).toBeInstanceOf(UserAlreadyExistsError);
    }

    // Ripristina i mock
    mockRandomBytes.mockRestore();
    mockDBRun.mockRestore();
    mockScryptSync.mockRestore();
});

describe('UserDAO', () => {
    describe('createUser', () => {
        test('should reject with an error if an exception occurs', async () => {
            // Mock di crypto.randomBytes per simulare un'eccezione durante la generazione del salt
            const mockRandomBytes = jest.spyOn(crypto, 'randomBytes').mockImplementation(() => {
                throw new Error('Failed to generate salt');
            });

            // Utilizziamo un mock per la funzione 'reject' per verificare se viene chiamata correttamente nel blocco 'catch'
            const rejectMock = jest.fn();

            // Istanzia un'istanza di UserDAO
            const userDAO = new UserDAO();

            // Aggiungiamo un blocco 'catch' al test per controllare se viene eseguito correttamente
            try {
                await userDAO.createUser('username', 'name', 'surname', 'password', 'role');
            } catch (error) {
                // Verifica se il blocco 'catch' viene eseguito correttamente
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Failed to generate salt');
                // Verifica che la funzione 'reject' sia stata chiamata correttamente
                rejectMock(error);
            }

            // Verifica che la funzione 'reject' sia stata chiamata nel blocco 'catch'
            expect(rejectMock).toHaveBeenCalled();

            // Ripristina il mock di crypto.randomBytes
            mockRandomBytes.mockRestore();
        });
    });
});


//Tests for getUsersByUsername method
describe('getUserByUsername', () => {
    test('should resolve with user information if user exists', async () => {
        const userDAO = new UserDAO();
        // Mock di db.get per simulare un utente esistente
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, {
                username: 'username',
                name: 'John',
                surname: 'Doe',
                role: 'Customer',
                address: '123 Street',
                birthdate: '1990-01-01'
            });
            return {} as Database;
        });

        const user = await userDAO.getUserByUsername('username');
        expect(user.username).toBe('username');
        expect(user.name).toBe('John');
        expect(user.surname).toBe('Doe');
        expect(user.role).toBe('Customer');
        expect(user.address).toBe('123 Street');
        expect(user.birthdate).toBe('1990-01-01');

        mockDBGet.mockRestore();
    });

    test('should reject with UserNotFoundError if user does not exist', async () => {
        const userDAO = new UserDAO();
        // Mock di db.get per simulare un utente non esistente
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(userDAO.getUserByUsername('nonexistent_user')).rejects.toThrow(UserNotFoundError);

        mockDBGet.mockRestore();
    });

    test('should reject with an error if database query fails', async () => {
        const userDAO = new UserDAO();
        // Mock di db.get per simulare un errore di query al database
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null);
            return {} as Database;
        });

        await expect(userDAO.getUserByUsername('username')).rejects.toThrow('Database error');

        mockDBGet.mockRestore();
    });
    test('should reject with an error if an exception occurs in the try block', async () => {
        const userDAO = new UserDAO();
        // Mock di db.get per simulare un'eccezione nel blocco try
        const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            throw new Error('Unexpected error occurred');
        });
    
        await expect(userDAO.getUserByUsername('username')).rejects.toThrow('Unexpected error occurred');
    
        mockDBGet.mockRestore();
    });
    
});


//Tests for getUsers method
test('should resolve with an array of users if the query is successful', async () => {
    const userDAO = new UserDAO();
    // Mock di db.all per simulare il successo della query
    const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        const rows = [
            { username: 'user1', name: 'John', surname: 'Doe', role: 'Customer', address: '123 Street', birthdate: '1990-01-01' },
            { username: 'user2', name: 'Jane', surname: 'Doe', role: 'Customer', address: '456 Street', birthdate: '1995-05-05' }
        ];
        callback(null, rows);
        return {} as Database;
    });

    const result = await userDAO.getUsers();

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(User);
    expect(result[1]).toBeInstanceOf(User);

    mockDBAll.mockRestore();
});

test('should reject with an error if the query fails', async () => {
    const userDAO = new UserDAO();
    // Mock di db.all per simulare un errore nella query
    const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        callback(new Error('Database error'), null);
        return {} as Database;
    });

    await expect(userDAO.getUsers()).rejects.toThrow('Database error');

    mockDBAll.mockRestore();
});

test('should reject with an error if an exception occurs in the try block', async () => {
    const userDAO = new UserDAO();
    // Mock di db.all per simulare un'eccezione nel blocco try
    const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        throw new Error('Unexpected error occurred');
    });

    await expect(userDAO.getUsers()).rejects.toThrow('Unexpected error occurred');

    mockDBAll.mockRestore();
});

//Tests for getUsersByRole method
test('should resolve with an array of users if the query is successful', async () => {
    const userDAO = new UserDAO();
    // Mock di db.all per simulare il successo della query
    const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        const rows = [
            { username: 'user1', name: 'John', surname: 'Doe', role: 'Customer', address: '123 Street', birthdate: '1990-01-01' },
            { username: 'user2', name: 'Jane', surname: 'Doe', role: 'Customer', address: '456 Street', birthdate: '1995-05-05' }
        ];
        callback(null, rows);
        return {} as Database;
    });

    const result = await userDAO.getUsersByRole('Customer');

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(User);
    expect(result[1]).toBeInstanceOf(User);

    mockDBAll.mockRestore();
});

test('should reject with an error if the query fails', async () => {
    const userDAO = new UserDAO();
    // Mock di db.all per simulare un errore nella query
    const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        callback(new Error('Database error'), null);
        return {} as Database;
    });

    await expect(userDAO.getUsersByRole('Customer')).rejects.toThrow('Database error');

    mockDBAll.mockRestore();
});

test('should reject with an error if an exception occurs in the try block', async () => {
    const userDAO = new UserDAO();
    // Mock di db.all per simulare un'eccezione nel blocco try
    const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        throw new Error('Unexpected error occurred');
    });

    await expect(userDAO.getUsersByRole('Customer')).rejects.toThrow('Unexpected error occurred');

    mockDBAll.mockRestore();
});

//Tests for deleteUser method
test('should resolve to true if the user is successfully deleted', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare il successo della query
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
    });

    const result = await userDAO.deleteUser('username');

    expect(result).toBe(true);

    mockDBRun.mockRestore();
});

test('should reject with an error if the deletion query fails', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare un errore nella query
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        callback(new Error('Database error'));
        return {} as Database;
    });

    await expect(userDAO.deleteUser('username')).rejects.toThrow('Database error');

    mockDBRun.mockRestore();
});

test('should reject with an error if an exception occurs in the try block', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare un'eccezione nel blocco try
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        throw new Error('Unexpected error occurred');
    });

    await expect(userDAO.deleteUser('username')).rejects.toThrow('Unexpected error occurred');

    mockDBRun.mockRestore();
});

//Tests for deleteAllUsers method
test('should resolve to true if all non-admin users are successfully deleted', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare il successo della query
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
    });

    const result = await userDAO.deleteALL();

    expect(result).toBe(true);

    mockDBRun.mockRestore();
});

test('should reject with an error if the deletion query fails', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare un errore nella query
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        callback(new Error('Database error'));
        return {} as Database;
    });

    await expect(userDAO.deleteALL()).rejects.toThrow('Database error');

    mockDBRun.mockRestore();
});

test('should reject with an error if an exception occurs in the try block', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare un'eccezione nel blocco try
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        throw new Error('Unexpected error occurred');
    });

    await expect(userDAO.deleteALL()).rejects.toThrow('Unexpected error occurred');

    mockDBRun.mockRestore();
});

//Tests for updateUser method
test('should resolve to the updated user if the information is successfully updated', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare il successo dell'aggiornamento
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
    });

    const user = new User('testUser', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
    const updatedUser = await userDAO.updateUserInfo(user, 'New Name', 'New Surname', 'New Address', '1995-05-05');
    const newUser = new User('testUser', 'New Name', 'New Surname', Role.CUSTOMER, 'New Address', '1995-05-05');
    expect(updatedUser).toEqual(newUser);

    mockDBRun.mockRestore();
});

test('should reject with an error if the update query fails', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare un errore nell'aggiornamento
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        callback(new Error('Database error'));
        return {} as Database;
    });

    const user = new User('testUser', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
    await expect(userDAO.updateUserInfo(user, 'New Name', 'New Surname', 'New Address', '1995-05-05')).rejects.toThrow('Database error');

    mockDBRun.mockRestore();
});

test('should reject with an error if an exception occurs in the try block', async () => {
    const userDAO = new UserDAO();
    // Mock di db.run per simulare un'eccezione nel blocco try
    const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        throw new Error('Unexpected error occurred');
    });

    const user = new User('testUser', 'Test', 'User', Role.CUSTOMER, '123 Test St', '1990-01-01');
    await expect(userDAO.updateUserInfo(user, 'New Name', 'New Surname', 'New Address', '1995-05-05')).rejects.toThrow('Unexpected error occurred');

    mockDBRun.mockRestore();
});





