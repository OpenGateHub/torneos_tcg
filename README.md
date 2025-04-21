# Proyecto Torneo de Cartas

Este es un sistema para gestionar torneos de cartas, donde los usuarios pueden registrarse, confirmar su cuenta a través de email, y participar en torneos. El sistema tiene soporte para roles de usuarios, incluyendo administradores y jugadores, y envía correos de confirmación de cuenta.

## Características

- Registro de usuarios con confirmación de correo electrónico.
- Autenticación de usuarios mediante JWT.
- Gestión de roles (administradores y jugadores).
- Rutas protegidas para usuarios autenticados.
- Creación y gestión de torneos (pendiente de implementación).
  
## Tecnologías

- **Backend:** Node.js, Express
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT (JSON Web Token)
- **Envio de correos:** Mailtrap (o el servicio de tu elección)
- **Validaciones:** express-validator
- **Hashing de contraseñas:** bcrypt
- **ORM:** Sequelize

