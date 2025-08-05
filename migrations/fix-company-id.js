const db = require("../config/db");
const Company = require("../models/Company");
const Torneo = require("../models/Torneo");

async function fixCompanyIdMigration() {
    try {
        console.log("Iniciando migración de companyId...");
        
        // 1. Buscar o crear una empresa por defecto
        let defaultCompany = await Company.findOne({
            where: { name: "Empresa por defecto" }
        });
        
        if (!defaultCompany) {
            console.log("Creando empresa por defecto...");
            defaultCompany = await Company.create({
                name: "Empresa por defecto",
                address: "Dirección no especificada",
                phone: "000-000-0000",
                email: "admin@default.com",
                coin_name: "Puntos",
                owner: "Administrador"
            });
            console.log(`Empresa por defecto creada con ID: ${defaultCompany.id}`);
        } else {
            console.log(`Empresa por defecto encontrada con ID: ${defaultCompany.id}`);
        }
        
        // 2. Actualizar todos los torneos que tengan companyId null
        const torneosNull = await Torneo.findAll({
            where: { companyId: null }
        });
        
        console.log(`Encontrados ${torneosNull.length} torneos sin companyId`);
        
        if (torneosNull.length > 0) {
            await Torneo.update(
                { companyId: defaultCompany.id },
                { where: { companyId: null } }
            );
            console.log(`Actualizados ${torneosNull.length} torneos con companyId: ${defaultCompany.id}`);
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
