const db = require("../config/db");

async function fixCompanyIdMigration() {
    try {
        console.log("Iniciando migración de companyId...");
        
        // 1. Verificar si la columna companyId ya existe
        const columnExists = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'torneos' 
            AND column_name = 'companyId'
        `, { type: db.QueryTypes.SELECT });
        
        if (columnExists.length === 0) {
            console.log("La columna companyId no existe aún, omitiendo migración inicial...");
            return;
        }
        
        // 2. Buscar o crear una empresa por defecto usando SQL directo
        let defaultCompanyResult = await db.query(`
            SELECT id FROM companies WHERE name = 'Empresa por defecto' LIMIT 1
        `, { type: db.QueryTypes.SELECT });
        
        let defaultCompanyId;
        
        if (defaultCompanyResult.length === 0) {
            console.log("Creando empresa por defecto...");
            const insertResult = await db.query(`
                INSERT INTO companies (name, address, phone, email, coin_name, owner, "createdAt", "updatedAt")
                VALUES ('Empresa por defecto', 'Dirección no especificada', '000-000-0000', 'admin@default.com', 'Puntos', 'Administrador', NOW(), NOW())
                RETURNING id
            `, { type: db.QueryTypes.INSERT });
            
            defaultCompanyId = insertResult[0][0].id;
            console.log(`Empresa por defecto creada con ID: ${defaultCompanyId}`);
        } else {
            defaultCompanyId = defaultCompanyResult[0].id;
            console.log(`Empresa por defecto encontrada con ID: ${defaultCompanyId}`);
        }
        
        // 3. Contar y actualizar torneos sin companyId usando SQL directo
        const countResult = await db.query(`
            SELECT COUNT(*) as count FROM torneos WHERE "companyId" IS NULL
        `, { type: db.QueryTypes.SELECT });
        
        const torneosNullCount = countResult[0].count;
        console.log(`Encontrados ${torneosNullCount} torneos sin companyId`);
        
        if (torneosNullCount > 0) {
            await db.query(`
                UPDATE torneos SET "companyId" = :companyId WHERE "companyId" IS NULL
            `, {
                replacements: { companyId: defaultCompanyId },
                type: db.QueryTypes.UPDATE
            });
            console.log(`Actualizados ${torneosNullCount} torneos con companyId: ${defaultCompanyId}`);
        }
        
        console.log("Migración completada exitosamente");
        
    } catch (error) {
        console.error("Error en la migración:", error);
        throw error;
    }
}

module.exports = { fixCompanyIdMigration };

// Si se ejecuta directamente
if (require.main === module) {
    fixCompanyIdMigration()
        .then(() => {
            console.log("Migración ejecutada exitosamente");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Error ejecutando migración:", error);
            process.exit(1);
        });
}
