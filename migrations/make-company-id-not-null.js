const db = require("../config/db");

async function makeCompanyIdNotNull() {
    try {
        console.log("Verificando si companyId necesita ser cambiado a NOT NULL...");
        
        // 1. Verificar si la columna existe y su estado actual
        const columnInfo = await db.query(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'torneos' 
            AND column_name = 'companyId'
        `, { type: db.QueryTypes.SELECT });
        
        if (columnInfo.length === 0) {
            console.log("La columna companyId no existe, omitiendo...");
            return;
        }
        
        const isNullable = columnInfo[0].is_nullable === 'YES';
        
        if (!isNullable) {
            console.log("La columna companyId ya es NOT NULL");
            return;
        }
        
        // 2. Verificar que no hay valores null antes de cambiar la restricción
        const nullCount = await db.query(`
            SELECT COUNT(*) as count FROM torneos WHERE "companyId" IS NULL
        `, { type: db.QueryTypes.SELECT });
        
        if (nullCount[0].count > 0) {
            console.log(`Advertencia: Aún hay ${nullCount[0].count} registros con companyId null. No se puede cambiar a NOT NULL.`);
            return;
        }
        
        // 3. Cambiar la columna a NOT NULL
        await db.query(`
            ALTER TABLE "torneos" 
            ALTER COLUMN "companyId" SET NOT NULL;
        `);
        
        console.log("companyId cambiado a NOT NULL exitosamente");
        
    } catch (error) {
        console.error("Error cambiando companyId a NOT NULL:", error);
        // No relanzamos el error para que no detenga toda la aplicación
        console.log("Continuando sin aplicar restricción NOT NULL...");
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
