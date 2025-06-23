const Usuarios = require('../models/Usuarios');
const bcrypt = require('bcrypt');

class UserController {
    // Obtener todos los usuarios
    async getAll(req, res) {
        const {email, provincia, dni} = req.query
        const where = {}

        if (email) {
            where.email = email;
        }

        if (provincia) {
            where.provincia = provincia;
        }

        if (dni) {
            where.dni = dni;
        }

        try {
            const users = await Usuarios.findAll({
                where,
                attributes: { exclude: ['password', 'token', 'expiraToken'] }
            });
            return res.json(users);
        } catch (error) {
            return res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
        }
    }

    // Obtener un usuario por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const user = await Usuarios.findByPk(id, {
                attributes: { exclude: ['password', 'token', 'expiraToken'] }
            });

            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            return res.json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
        }
    }

    // Crear un nuevo usuario
    async create(req, res) {
        try {
            const {
                email,
                nombre,
                last_name,
                password,
                birthdate,
                provincia,
                city,
                bio
            } = req.body;

            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await Usuarios.create({
                email,
                nombre,
                last_name,
                password: hashedPassword,
                birthdate,
                provincia,
                city,
                bio,
                rol: 'jugador' // Por defecto todos los usuarios creados son jugadores
            });

            // Excluir datos sensibles en la respuesta
            const { password: _, token: __, expiraToken: ___, ...userResponse } = user.toJSON();

            return res.status(201).json(userResponse);
        } catch (error) {
            return res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
        }
    }

    // Actualizar un usuario
    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                nombre,
                last_name,
                birthdate,
                provincia,
                city,
                bio
            } = req.body;

            const user = await Usuarios.findByPk(id);

            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            await user.update({
                nombre,
                last_name,
                birthdate,
                provincia,
                city,
                bio
            });

            // Excluir datos sensibles en la respuesta
            const { password: _, token: __, expiraToken: ___, ...userResponse } = user.toJSON();

            return res.json(userResponse);
        } catch (error) {
            return res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
        }
    }

    // Eliminar un usuario
    async delete(req, res) {
        try {
            const { id } = req.params;
            const user = await Usuarios.findByPk(id);

            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            await user.destroy();

            return res.json({ message: 'Usuario eliminado correctamente' });
        } catch (error) {
            return res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
        }
    }
}

module.exports = new UserController();