const Usuarios = require('../models/Usuarios');
const bcrypt = require('bcrypt');

async function createPlayers() {
  try {
    const password = await bcrypt.hash('password123', 10);
    
    const players = Array.from({ length: 10 }, (_, i) => ({
      email: `jugador${i + 1}@example.com`,
      nombre: `Jugador ${i + 1}`,
      last_name: `Apellido ${i + 1}`,
      password,
      rol: 'jugador',
      activo: true,
      verified: true,
      birthdate: new Date(1990, 0, 1), // 1 de enero de 1990
      provincia: 'San José',
      city: 'San José',
      dni: `1${i.toString().padStart(3, '0')}`,
      bio: `Bio del jugador ${i + 1}`
    }));

    await Usuarios.bulkCreate(players);
    console.log('✅ Jugadores creados exitosamente');
  } catch (error) {
    console.error('Error al crear jugadores:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createPlayers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = createPlayers;