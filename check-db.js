const db = require("./config/db");

async function checkDatabaseStatus() {
    try {
        console.log("🔍 Verificando estado de la base de datos...");
        
        // Conectar a la base de datos
        await db.authenticate();
        console.log("✅ Conexión establecida");
        
        // Verificar si existe la tabla companies
        const companiesExists = await db.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'companies'
        `, { type: db.QueryTypes.SELECT });
        
        console.log(`📋 Tabla companies: ${companiesExists.length > 0 ? '✅ Existe' : '❌ No existe'}`);
        
        // Verificar si existe la tabla torneos
        const torneosExists = await db.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'torneos'
        `, { type: db.QueryTypes.SELECT });
        
        console.log(`📋 Tabla torneos: ${torneosExists.length > 0 ? '✅ Existe' : '❌ No existe'}`);
        
        if (torneosExists.length > 0) {
            // Verificar si existe la columna companyId
            const companyIdExists = await db.query(`
                SELECT column_name, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'torneos' AND column_name = 'companyId'
            `, { type: db.QueryTypes.SELECT });
            
            if (companyIdExists.length > 0) {
                const isNullable = companyIdExists[0].is_nullable === 'YES';
                console.log(`🏢 Columna companyId: ✅ Existe (${isNullable ? 'NULLABLE' : 'NOT NULL'})`);
                
                // Contar torneos sin companyId
                const nullCount = await db.query(`
                    SELECT COUNT(*) as count FROM torneos WHERE "companyId" IS NULL
                `, { type: db.QueryTypes.SELECT });
                
                console.log(`📊 Torneos sin companyId: ${nullCount[0].count}`);
                
                // Contar total de torneos
                const totalCount = await db.query(`
                    SELECT COUNT(*) as count FROM torneos
                `, { type: db.QueryTypes.SELECT });
                
                console.log(`📊 Total de torneos: ${totalCount[0].count}`);
                
            } else {
                console.log(`🏢 Columna companyId: ❌ No existe`);
            }
        }
        
        if (companiesExists.length > 0) {
            // Contar empresas
            const companyCount = await db.query(`
                SELECT COUNT(*) as count FROM companies
            `, { type: db.QueryTypes.SELECT });
            
            console.log(`🏢 Total de empresas: ${companyCount[0].count}`);
            
            // Verificar si existe la empresa por defecto
            const defaultCompany = await db.query(`
                SELECT id, name FROM companies WHERE name = 'Empresa por defecto'
            `, { type: db.QueryTypes.SELECT });
            
            if (defaultCompany.length > 0) {
                console.log(`🏭 Empresa por defecto: ✅ Existe (ID: ${defaultCompany[0].id})`);
            } else {
                console.log(`🏭 Empresa por defecto: ❌ No existe`);
            }
        }
        
        console.log("✅ Verificación completada");
        
    } catch (error) {
        console.error("❌ Error verificando la base de datos:", error);
    } finally {
        await db.close();
    }
}

// Ejecutar la verificación
checkDatabaseStatus()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });
