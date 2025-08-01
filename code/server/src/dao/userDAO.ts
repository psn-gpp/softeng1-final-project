import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError } from "../errors/userError";
import dayjs from 'dayjs' ;

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                /**
                 * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
                 * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
                 */
                const sql = "SELECT username, password, salt FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                    if (!row || row.username !== username || !row.salt) {
                        resolve(false)
                    } else {
                        //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                        const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                        const passwordHex = Buffer.from(row.password, "hex")
                        if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false)
                        resolve(true)
                    }

                })
            } catch (error) {
                reject(error)
            }

        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(16)
                const hashedPassword = crypto.scryptSync(password, salt, 16)
                const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: users.username")) reject(new UserAlreadyExistsError)
                        reject(err)
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    resolve(user)
                })
            } catch (error) {
                reject(error)
            }

        })
    }


    /**
     * Returns all users.
     * @returns A Promise that resolves to an array of users.
     */
    getUsers(): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users"
                db.all(sql, [], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    const users: User[] = []
                    for (const row of rows) {
                        const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                        users.push(user)
                    }
                    resolve(users)
                })
            } catch (error) {
                reject(error)
            }
    })

}


getUsersByRole(role: string): Promise<User[]> {
    return new Promise<User[]>((resolve, reject) => {
        try {
            const sql = "SELECT * FROM users WHERE role = ?"
            db.all(sql, [role], (err: Error | null, rows: any) => {
                if (err) {
                    reject(err)
                    return
                }
                const users: User[] = []
                for (const row of rows) {
                    const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    users.push(user)
                }
                resolve(users)
            })
        } catch (error) {
            reject(error)
        }
    })
}


deleteUser(username: String): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
       try {
           const sql = "DELETE FROM users WHERE username = ?"
           db.run(sql, [username], (err: Error | null) => {
               if (err) {
                   reject(err)
                   return
               }
               resolve(true)
           })
       } catch (error) {
           reject(error)
       }
})
}


// delete all non admin users from the database
deleteALL(): Promise<boolean> {
return new Promise<boolean>((resolve, reject) => {
   try {
       const sql = "DELETE FROM users WHERE role!= 'Admin'"
       db.run(sql, [], (err: Error | null) => {
           if (err) {
               reject(err)
               return
           }
           
           resolve(true)
       })
   } catch (error) {
       reject(error)
   }

})

}

/**
* Updates the personal information of one user. The user can only update their own information.
* @param user The user who wants to update their information
* @param name The new name of the user
* @param surname The new surname of the user
* @param address The new address of the user
* @param birthdate The new birthdate of the user
* @param username The username of the user to update. It must be equal to the username of the user parameter.
* @returns A Promise that resolves to the updated user
*/
updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
       try {
           const sql = "UPDATE users SET name =?, surname =?, address =?, birthdate =? WHERE username = ?"
           db.run(sql, [name, surname, address, birthdate, user.username], (err: Error | null) => {
               if (err) {
                   reject(err)
                   return
               }
                const newUser = new User(user.username, name, surname, user.role, address, birthdate)
               resolve(newUser)
           })
       } catch (error) {
           reject(error)
       }
   })
}
}
export default UserDAO