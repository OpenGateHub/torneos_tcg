const db = require("./config/db");
const Company = require("./models/Company");
const Torneo = require("./models/Torneo");

async function runMigration() {
    try {
        console.log("🔄 Iniciando migración manual de companyId...");
        
        // Conectar a la base de datos
        await db.authenticate();
        console.log("✅ Conexión a la base de datos establecida");
        
        // 1. Buscar o crear una empresa por defecto
        let defaultCompany = await Company.findOne({
            where: { name: "Empresa por defecto" }
        });
        
        if (!defaultCompany) {
            console.log("🏢 Creando empresa por defecto...");
            defaultCompany = await Company.create({
                name: "Empresa por defecto",
                address: "Dirección no especificada",
                phone: "000-000-0000",
                email: "admin@default.com",
                coin_name: "Puntos",
                owner: "Administrador"
            });
            console.log(`✅ Empresa por defecto creada con ID: ${defaultCompany.id}`);
        } else {
            console.log(`ℹ️  Empresa por defecto encontrada con ID: ${defaultCompany.id}`);
        }
        
        // 2. Verificar cuántos torneos tienen companyId null
        const torneosNullCount = await db.query(`
            SELECT COUNT(*) as count 
            FROM torneos 
            WHERE "companyId" IS NULL
        `, { type: db.QueryTypes.SELECT });
        
        const count = torneosNullCount[0].count;
        console.log(`📊 Encontrados ${count} torneos sin companyId`);
        
        if (count > 0) {
            // 3. Actualizar los torneos con companyId null
            const [results] = await db.query(`
                UPDATE torneos 
                SET "companyId" = :companyId 
                WHERE "companyId" IS NULL
            `, {
                replacements: { companyId: defaultCompany.id },
                type: db.QueryTypes.UPDATE
            });
            
            console.log(`✅ Actualizados ${count} torneos con companyId: ${defaultCompany.id}`);
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
