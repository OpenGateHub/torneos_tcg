const db = require("../config/db");

async function makeCompanyIdNotNull() {
    try {
        console.log("Cambiando companyId a NOT NULL...");
        
        // Ejecutar la consulta SQL directamente para cambiar la restricción
        await db.query(`
            ALTER TABLE "torneos" 
            ALTER COLUMN "companyId" SET NOT NULL;
        `);
        
        console.log("companyId cambiado a NOT NULL exitosamente");
        
    } catch (error) {
        console.error("Error cambiando companyId a NOT NULL:", error);
        throw error;
    }
}

module.exports = { makeCompanyIdNotNull };

// Si se ejecuta directamente
if (require.main === module) {
    makeCompanyIdNotNull()
        .then(() => {
            console.log("Restricción NOT NULL aplicada exitosamente");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Error aplicando restricción NOT NULL:", error);
            process.exit(1);
        });
}
