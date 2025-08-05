const db = require("./config/db");

async function runMigration() {
    try {
        console.log("🔄 Iniciando migración manual de companyId...");
        
        // Conectar a la base de datos
        await db.authenticate();
        console.log("✅ Conexión a la base de datos establecida");
        
        // 1. Verificar si la tabla companies existe
        const companiesTableExists = await db.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'companies'
        `, { type: db.QueryTypes.SELECT });
        
        if (companiesTableExists.length === 0) {
            console.log("❌ La tabla companies no existe. Ejecuta el servidor primero para crear las tablas.");
            return;
        }
        
        // 2. Verificar si la columna companyId existe en torneos
        const columnExists = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'torneos' AND column_name = 'companyId'
        `, { type: db.QueryTypes.SELECT });
        
        if (columnExists.length === 0) {
            console.log("ℹ️  La columna companyId no existe aún. Esto es normal si es la primera ejecución.");
            console.log("🔧 Ejecuta el servidor para que Sequelize cree la columna automáticamente.");
            return;
        }
        
        // 3. Buscar o crear una empresa por defecto
        let defaultCompanyResult = await db.query(`
            SELECT id FROM companies WHERE name = 'Empresa por defecto' LIMIT 1
        `, { type: db.QueryTypes.SELECT });
        
        let defaultCompanyId;
        
        if (defaultCompanyResult.length === 0) {
            console.log("🏢 Creando empresa por defecto...");
            const insertResult = await db.query(`
                INSERT INTO companies (name, address, phone, email, coin_name, owner, "createdAt", "updatedAt")
                VALUES ('Empresa por defecto', 'Dirección no especificada', '000-000-0000', 'admin@default.com', 'Puntos', 'Administrador', NOW(), NOW())
                RETURNING id
            `, { type: db.QueryTypes.INSERT });
            
            defaultCompanyId = insertResult[0][0].id;
            console.log(`✅ Empresa por defecto creada con ID: ${defaultCompanyId}`);
        } else {
            defaultCompanyId = defaultCompanyResult[0].id;
            console.log(`ℹ️  Empresa por defecto encontrada con ID: ${defaultCompanyId}`);
        }
        
        // 4. Verificar cuántos torneos tienen companyId null
        const torneosNullCount = await db.query(`
            SELECT COUNT(*) as count 
            FROM torneos 
            WHERE "companyId" IS NULL
        `, { type: db.QueryTypes.SELECT });
        
        const count = torneosNullCount[0].count;
        console.log(`📊 Encontrados ${count} torneos sin companyId`);
        
        if (count > 0) {
            // 5. Actualizar los torneos con companyId null
            await db.query(`
                UPDATE torneos 
                SET "companyId" = :companyId 
                WHERE "companyId" IS NULL
            `, {
                replacements: { companyId: defaultCompanyId },
                type: db.QueryTypes.UPDATE
            });
            
            console.log(`✅ Actualizados ${count} torneos con companyId: ${defaultCompanyId}`);
        }
        
        // 6. Verificar si la columna permite null y cambiarla si es necesario
        const columnInfo = await db.query(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'torneos' 
            AND column_name = 'companyId'
        `, { type: db.QueryTypes.SELECT });
        
        const isNullable = columnInfo[0].is_nullable === 'YES';
        
        if (isNullable) {
            console.log("🔧 Aplicando restricción NOT NULL a companyId...");
            await db.query(`
                ALTER TABLE "torneos" 
                ALTER COLUMN "companyId" SET NOT NULL;
            `);
            console.log("✅ Restricción NOT NULL aplicada exitosamente");
        } else {
            console.log("ℹ️  La columna companyId ya es NOT NULL");
        }
        
        console.log("🎉 Migración completada exitosamente!");
        console.log("🔧 Ahora puedes reiniciar tu aplicación");
        
    } catch (error) {
        console.error("❌ Error en la migración:", error);
        throw error;
    } finally {
        await db.close();
    }
}

// Ejecutar la migración
runMigration()
    .then(() => {
        console.log("✅ Script de migración ejecutado exitosamente");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Error ejecutando script de migración:", error);
        process.exit(1);
    });
