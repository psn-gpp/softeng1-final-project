import db from "../db/db";

function runQuery(query: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export async function cleanup() {
    await runQuery("DELETE FROM users");
    await runQuery("DELETE FROM cart");
    await runQuery("DELETE FROM product");
    await runQuery("DELETE FROM productInCart");
    await runQuery("DELETE FROM review");
}
